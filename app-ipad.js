(function () {
  var PIECE_SYMBOLS = {
    wp: "\u2659",
    wn: "\u2658",
    wb: "\u2657",
    wr: "\u2656",
    wq: "\u2655",
    wk: "\u2654",
    bp: "\u265F",
    bn: "\u265E",
    bb: "\u265D",
    br: "\u265C",
    bq: "\u265B",
    bk: "\u265A"
  };

  var STORAGE_KEY = "ipad-chess-settings-v1";
  var boardEl = document.getElementById("board");
  var turnChipEl = document.getElementById("turn-chip");
  var statusPillEl = document.getElementById("status-pill");
  var selectionHintEl = document.getElementById("selection-hint");
  var lastMoveEl = document.getElementById("last-move");
  var turnTextEl = document.getElementById("turn-text");
  var modeTextEl = document.getElementById("mode-text");
  var aiTextEl = document.getElementById("ai-text");
  var gameMessageEl = document.getElementById("game-message");
  var moveListEl = document.getElementById("move-list");
  var installTipEl = document.getElementById("install-tip");
  var modeSelectEl = document.getElementById("mode-select");
  var difficultySelectEl = document.getElementById("difficulty-select");
  var playerColorSelectEl = document.getElementById("player-color-select");
  var restartBtnEl = document.getElementById("restart-btn");
  var undoBtnEl = document.getElementById("undo-btn");
  var promotionModalEl = document.getElementById("promotion-modal");
  var promotionButtons = promotionModalEl.querySelectorAll("button");
  var savedSettings = loadSettings();
  var initialGame = ChessEngine.createGame();
  var appState = {
    game: initialGame,
    history: [ChessEngine.cloneState(initialGame)],
    moveHistory: [],
    selectedSquare: null,
    legalMoves: [],
    mode: savedSettings.mode || "ai",
    difficulty: savedSettings.difficulty || "medium",
    playerColor: savedSettings.playerColor || "w",
    aiThinking: false,
    pendingPromotion: null
  };

  modeSelectEl.value = appState.mode;
  difficultySelectEl.value = appState.difficulty;
  playerColorSelectEl.value = appState.playerColor;

  function loadSettings() {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function persistSettings() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: appState.mode,
      difficulty: appState.difficulty,
      playerColor: appState.playerColor
    }));
  }

  function createCoord(className, text) {
    var span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    return span;
  }

  function initializeBoard() {
    var row;
    var col;
    var squareButton;
    var index;
    var squareColor;

    for (row = 0; row < 8; row += 1) {
      for (col = 0; col < 8; col += 1) {
        index = row * 8 + col;
        squareColor = (row + col) % 2 === 0 ? "light" : "dark";
        squareButton = document.createElement("button");
        squareButton.type = "button";
        squareButton.className = "square " + squareColor;
        squareButton.setAttribute("data-index", String(index));
        squareButton.addEventListener("click", handleSquareClick);
        if (row === 7) {
          squareButton.appendChild(createCoord("coord coord-file", String.fromCharCode(97 + col)));
        }
        if (col === 0) {
          squareButton.appendChild(createCoord("coord coord-rank", String(8 - row)));
        }
        boardEl.appendChild(squareButton);
      }
    }
  }

  function cloneMove(move) {
    var copy = {};
    var key;
    for (key in move) {
      if (Object.prototype.hasOwnProperty.call(move, key)) {
        copy[key] = move[key];
      }
    }
    return copy;
  }

  function canSelectPiece(pieceColor) {
    if (appState.mode === "human") {
      return true;
    }
    return pieceColor === appState.playerColor;
  }

  function isHumanTurn() {
    if (appState.mode === "human") {
      return true;
    }
    return appState.game.turn === appState.playerColor;
  }

  function getMovesFrom(index) {
    var legalMoves = ChessEngine.generateLegalMoves(appState.game, appState.game.turn);
    var result = [];
    var i;

    for (i = 0; i < legalMoves.length; i += 1) {
      if (legalMoves[i].from === index) {
        result.push(legalMoves[i]);
      }
    }

    return result;
  }

  function findMoveTo(targetIndex) {
    var i;
    for (i = 0; i < appState.legalMoves.length; i += 1) {
      if (appState.legalMoves[i].to === targetIndex) {
        return appState.legalMoves[i];
      }
    }
    return null;
  }

  function clearSelection(shouldRender) {
    appState.selectedSquare = null;
    appState.legalMoves = [];
    appState.pendingPromotion = null;
    selectionHintEl.textContent = "\u70B9\u51FB\u68CB\u5B50\u5F00\u59CB\u79FB\u52A8";
    closePromotionModal();
    if (shouldRender !== false) {
      render();
    }
  }

  function handleSquareClick(event) {
    var index = parseInt(event.currentTarget.getAttribute("data-index"), 10);
    var piece = appState.game.board[index];
    var pieceColor = piece ? piece.charAt(0) : null;
    var move = findMoveTo(index);

    if (appState.aiThinking || appState.pendingPromotion) {
      return;
    }
    if (!isHumanTurn()) {
      setMessage("\u73B0\u5728\u662F AI \u56DE\u5408\uFF0C\u8BF7\u7A0D\u5019\u3002");
      return;
    }
    if (move) {
      if (move.promotion) {
        openPromotionModal(move);
      } else {
        commitMove(move);
      }
      return;
    }
    if (piece && pieceColor === appState.game.turn && canSelectPiece(pieceColor)) {
      appState.selectedSquare = index;
      appState.legalMoves = getMovesFrom(index);
      selectionHintEl.textContent =
        "\u5DF2\u9009\u4E2D " + ChessEngine.squareName(index) + "\uFF0C\u8BF7\u9009\u62E9\u843D\u70B9\u3002";
      render();
      return;
    }
    clearSelection();
  }

  function setMessage(text) {
    gameMessageEl.textContent = text;
  }

  function commitMove(move) {
    appState.game = ChessEngine.makeMove(appState.game, cloneMove(move));
    appState.history.push(ChessEngine.cloneState(appState.game));
    appState.moveHistory.push(ChessEngine.moveToNotation(move));
    clearSelection(false);
    render();
    maybeRunAI();
  }

  function resetGame() {
    appState.game = ChessEngine.createGame();
    appState.history = [ChessEngine.cloneState(appState.game)];
    appState.moveHistory = [];
    clearSelection(false);
    render();
    maybeRunAI();
  }

  function undoMove() {
    var steps = 1;

    if (appState.history.length <= 1 || appState.aiThinking) {
      return;
    }
    if (appState.mode === "ai" && appState.history.length >= 3 && appState.game.turn === appState.playerColor) {
      steps = 2;
    }
    while (steps > 0 && appState.history.length > 1) {
      appState.history.pop();
      if (appState.moveHistory.length) {
        appState.moveHistory.pop();
      }
      steps -= 1;
    }
    appState.game = ChessEngine.cloneState(appState.history[appState.history.length - 1]);
    clearSelection(false);
    render();
  }

  function openPromotionModal(move) {
    appState.pendingPromotion = move;
    promotionModalEl.classList.remove("hidden");
    promotionModalEl.setAttribute("aria-hidden", "false");
    render();
  }

  function closePromotionModal() {
    promotionModalEl.classList.add("hidden");
    promotionModalEl.setAttribute("aria-hidden", "true");
  }

  function applyPromotionChoice(pieceType) {
    var move;

    if (!appState.pendingPromotion) {
      return;
    }
    move = cloneMove(appState.pendingPromotion);
    move.promotion = pieceType;
    closePromotionModal();
    appState.pendingPromotion = null;
    commitMove(move);
  }

  function maybeRunAI() {
    if (appState.mode !== "ai") {
      return;
    }
    if (appState.game.turn !== ChessEngine.opposite(appState.playerColor)) {
      return;
    }
    if (ChessEngine.getGameStatus(appState.game).result !== "playing") {
      return;
    }

    appState.aiThinking = true;
    render();

    window.setTimeout(function () {
      var aiColor = ChessEngine.opposite(appState.playerColor);
      var bestMove = ChessEngine.findBestMove(appState.game, appState.difficulty, aiColor);
      if (bestMove) {
        appState.game = ChessEngine.makeMove(appState.game, bestMove);
        appState.history.push(ChessEngine.cloneState(appState.game));
        appState.moveHistory.push(ChessEngine.moveToNotation(bestMove));
      }
      appState.aiThinking = false;
      clearSelection(false);
      render();
    }, 240);
  }

  function removePieceNode(squareEl) {
    var pieces = squareEl.querySelectorAll(".piece");
    var i;

    for (i = 0; i < pieces.length; i += 1) {
      squareEl.removeChild(pieces[i]);
    }
  }

  function baseSquareClass(index) {
    var row = Math.floor(index / 8);
    var col = index % 8;
    return "square " + (((row + col) % 2 === 0) ? "light" : "dark");
  }

  function buildTargetMap() {
    var map = {};
    var i;

    for (i = 0; i < appState.legalMoves.length; i += 1) {
      map[appState.legalMoves[i].to] =
        (!!appState.legalMoves[i].captured || !!appState.legalMoves[i].isEnPassant) ? "capture" : "target";
    }
    return map;
  }

  function findKingSquare(game, color) {
    var i;
    for (i = 0; i < 64; i += 1) {
      if (game.board[i] === color + "k") {
        return i;
      }
    }
    return null;
  }

  function buildGameMessage(status) {
    if (status.result === "checkmate" || status.result === "draw" || status.result === "stalemate") {
      return localizeStatus(status) +
        "\u3002\u70B9\u51FB\u201C\u91CD\u65B0\u5F00\u59CB\u201D\u53EF\u5F00\u542F\u65B0\u5BF9\u5C40\u3002";
    }
    if (appState.mode === "ai" && appState.aiThinking) {
      return "AI \u6B63\u5728\u6839\u636E\u5F53\u524D\u5C40\u9762\u8BA1\u7B97\u843D\u5B50\u3002";
    }
    if (appState.mode === "human") {
      return "\u672C\u5730\u53CC\u4EBA\u6A21\u5F0F\u5DF2\u5F00\u542F\uFF0C\u53CC\u65B9\u5171\u7528\u540C\u4E00\u53F0\u8BBE\u5907\u8F6E\u6D41\u64CD\u4F5C\u3002";
    }
    return "\u4F60\u5F53\u524D\u6267" + (appState.playerColor === "w" ? "\u767D" : "\u9ED1") + "\uFF0CAI \u6267" +
      (appState.playerColor === "w" ? "\u9ED1" : "\u767D") + "\u3002";
  }

  function localizeStatus(status) {
    if (status.result === "checkmate") {
      return (status.winner === "w" ? "\u767D\u65B9" : "\u9ED1\u65B9") + "\u5C06\u6B7B\u83B7\u80DC";
    }
    if (status.result === "stalemate") {
      return "\u548C\u68CB\uFF1A\u903C\u548C";
    }
    if (status.result === "draw") {
      if (appState.game.halfmoveClock >= 100) {
        return "\u548C\u68CB\uFF1A\u4E94\u5341\u56DE\u5408\u89C4\u5219";
      }
      return "\u548C\u68CB\uFF1A\u5B50\u529B\u4E0D\u8DB3";
    }
    if (status.inCheck) {
      return (appState.game.turn === "w" ? "\u767D\u65B9" : "\u9ED1\u65B9") + "\u88AB\u5C06\u519B";
    }
    return "\u5BF9\u5C40\u8FDB\u884C\u4E2D";
  }

  function renderMoveList() {
    var html = "";
    var i;
    var whiteMove;
    var blackMove;

    for (i = 0; i < appState.moveHistory.length; i += 2) {
      whiteMove = appState.moveHistory[i] || "";
      blackMove = appState.moveHistory[i + 1] || "";
      html += "<li>" + whiteMove + (blackMove ? " / " + blackMove : "") + "</li>";
    }
    moveListEl.innerHTML = html;
  }

  function updateInstallTip() {
    var isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (isStandalone) {
      document.body.classList.add("standalone");
      installTipEl.textContent =
        "\u5F53\u524D\u5DF2\u7ECF\u662F\u4E3B\u5C4F\u5168\u5C4F\u6A21\u5F0F\uFF0C\u6253\u5F00\u540E\u5C31\u4F1A\u50CF iPad App \u4E00\u6837\u4F7F\u7528\u3002";
      return;
    }
    installTipEl.textContent =
      "\u5728 iPad Safari \u4E2D\u6253\u5F00\u540E\uFF0C\u70B9\u201C\u5206\u4EAB\u201D\u518D\u9009\u62E9\u201C\u6DFB\u52A0\u5230\u4E3B\u5C4F\u5E55\u201D\uFF0C\u5C31\u80FD\u50CF App \u4E00\u6837\u5168\u5C4F\u6253\u5F00\u3002";
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    if (window.location.protocol === "file:") {
      return;
    }
    navigator.serviceWorker.register("sw.js").catch(function () {
      return null;
    });
  }

  function render() {
    var squares = boardEl.querySelectorAll(".square");
    var status = ChessEngine.getGameStatus(appState.game);
    var selectedTargets = buildTargetMap();
    var kingInCheckIndex = status.inCheck ? findKingSquare(appState.game, appState.game.turn) : null;
    var i;
    var squareEl;
    var piece;
    var pieceEl;
    var pieceSideClass;

    for (i = 0; i < squares.length; i += 1) {
      squareEl = squares[i];
      piece = appState.game.board[i];
      squareEl.className = baseSquareClass(i);
      if (appState.selectedSquare === i) {
        squareEl.className += " selected";
      }
      if (Object.prototype.hasOwnProperty.call(selectedTargets, i)) {
        squareEl.className += selectedTargets[i] === "capture" ? " capture" : " target";
      }
      if (appState.game.lastMove && (appState.game.lastMove.from === i || appState.game.lastMove.to === i)) {
        squareEl.className += " last-move";
      }
      if (kingInCheckIndex === i) {
        squareEl.className += " check";
      }
      removePieceNode(squareEl);
      if (piece) {
        pieceEl = document.createElement("span");
        pieceSideClass = piece.charAt(0) === "w" ? "piece-white" : "piece-black";
        pieceEl.className = "piece " + pieceSideClass;
        pieceEl.textContent = PIECE_SYMBOLS[piece];
        squareEl.appendChild(pieceEl);
      }
    }

    turnChipEl.textContent = (appState.game.turn === "w" ? "\u767D\u65B9" : "\u9ED1\u65B9") + "\u56DE\u5408";
    statusPillEl.textContent = localizeStatus(status);
    turnTextEl.textContent = appState.game.turn === "w" ? "\u767D\u65B9" : "\u9ED1\u65B9";
    modeTextEl.textContent = appState.mode === "ai" ? "\u4EBA\u673A\u5BF9\u6218" : "\u4EBA\u4EBA\u5BF9\u6218";
    aiTextEl.textContent =
      appState.mode === "human" ? "\u672A\u542F\u7528" : (appState.aiThinking ? "\u601D\u8003\u4E2D..." : "\u5F85\u547D");
    lastMoveEl.textContent = "\u6700\u8FD1\u4E00\u6B65\uFF1A" +
      (appState.moveHistory.length ? appState.moveHistory[appState.moveHistory.length - 1] : "\u6682\u65E0");
    gameMessageEl.textContent = buildGameMessage(status);
    undoBtnEl.disabled = appState.history.length <= 1 || appState.aiThinking;
    difficultySelectEl.disabled = appState.mode !== "ai";
    playerColorSelectEl.disabled = appState.mode !== "ai";
    renderMoveList();

    if (appState.pendingPromotion) {
      setMessage("\u5175\u5230\u8FBE\u5E95\u7EBF\uFF0C\u8BF7\u9009\u62E9\u5347\u53D8\u68CB\u5B50\u3002");
    }
  }

  modeSelectEl.addEventListener("change", function (event) {
    appState.mode = event.target.value;
    persistSettings();
    resetGame();
  });

  difficultySelectEl.addEventListener("change", function (event) {
    appState.difficulty = event.target.value;
    persistSettings();
    render();
  });

  playerColorSelectEl.addEventListener("change", function (event) {
    appState.playerColor = event.target.value;
    persistSettings();
    resetGame();
  });

  restartBtnEl.addEventListener("click", resetGame);
  undoBtnEl.addEventListener("click", undoMove);

  promotionModalEl.addEventListener("click", function (event) {
    if (event.target === promotionModalEl) {
      closePromotionModal();
      appState.pendingPromotion = null;
      render();
    }
  });

  Array.prototype.forEach.call(promotionButtons, function (button) {
    button.addEventListener("click", function () {
      applyPromotionChoice(button.getAttribute("data-piece"));
    });
  });

  initializeBoard();
  updateInstallTip();
  registerServiceWorker();
  render();
  maybeRunAI();
}());
