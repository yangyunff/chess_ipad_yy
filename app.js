(function () {
  var PIECE_SYMBOLS = {
    wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
    bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚"
  };

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
  var modeSelectEl = document.getElementById("mode-select");
  var difficultySelectEl = document.getElementById("difficulty-select");
  var playerColorSelectEl = document.getElementById("player-color-select");
  var restartBtnEl = document.getElementById("restart-btn");
  var undoBtnEl = document.getElementById("undo-btn");
  var promotionModalEl = document.getElementById("promotion-modal");
  var promotionButtons = promotionModalEl.querySelectorAll("button");

  var appState = {
    game: ChessEngine.createGame(),
    history: [ChessEngine.cloneState(ChessEngine.createGame())],
    moveHistory: [],
    selectedSquare: null,
    legalMoves: [],
    mode: "ai",
    difficulty: "medium",
    playerColor: "w",
    aiThinking: false,
    pendingPromotion: null
  };

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

  function handleSquareClick(event) {
    var index = parseInt(event.currentTarget.getAttribute("data-index"), 10);
    var piece = appState.game.board[index];
    var pieceColor = piece ? piece.charAt(0) : null;
    var move = findMoveTo(index);

    if (appState.aiThinking || appState.pendingPromotion) {
      return;
    }
    if (!isHumanTurn()) {
      setMessage("现在是 AI 回合，请稍候。");
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
      selectionHintEl.textContent = "已选中 " + ChessEngine.squareName(index) + "，请选择落点。";
      render();
      return;
    }

    clearSelection();
  }

  function setMessage(text) {
    gameMessageEl.textContent = text;
  }

  function clearSelection(shouldRender) {
    appState.selectedSquare = null;
    appState.legalMoves = [];
    appState.pendingPromotion = null;
    selectionHintEl.textContent = "点击棋子开始移动";
    closePromotionModal();
    if (shouldRender !== false) {
      render();
    }
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
    }, 220);
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
      return status.message + "。点击“重新开始”可开启新对局。";
    }
    if (appState.mode === "ai" && appState.aiThinking) {
      return "AI 正在根据当前局面计算落子。";
    }
    if (appState.mode === "human") {
      return "本地双人模式已开启，双方共用同一台设备轮流操作。";
    }
    return "你当前执" + (appState.playerColor === "w" ? "白" : "黑") + "，AI 执" +
      (appState.playerColor === "w" ? "黑" : "白") + "。";
  }

  function localizeStatus(status) {
    if (status.result === "checkmate") {
      return (status.winner === "w" ? "白方" : "黑方") + "将死获胜";
    }
    if (status.result === "stalemate") {
      return "和棋：逼和";
    }
    if (status.result === "draw") {
      if (appState.game.halfmoveClock >= 100) {
        return "和棋：五十回合规则";
      }
      return "和棋：子力不足";
    }
    if (status.inCheck) {
      return (appState.game.turn === "w" ? "白方" : "黑方") + "被将军";
    }
    return "对局进行中";
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

  function render() {
    var squares = boardEl.querySelectorAll(".square");
    var status = ChessEngine.getGameStatus(appState.game);
    var selectedTargets = buildTargetMap();
    var kingInCheckIndex = status.inCheck ? findKingSquare(appState.game, appState.game.turn) : null;
    var i;
    var squareEl;
    var piece;
    var pieceEl;

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
        pieceEl.className = "piece";
        pieceEl.textContent = PIECE_SYMBOLS[piece];
        squareEl.appendChild(pieceEl);
      }
    }

    turnChipEl.textContent = (appState.game.turn === "w" ? "白方" : "黑方") + "回合";
    statusPillEl.textContent = localizeStatus(status);
    turnTextEl.textContent = appState.game.turn === "w" ? "白方" : "黑方";
    modeTextEl.textContent = appState.mode === "ai" ? "人机对战" : "人人对战";
    aiTextEl.textContent = appState.mode === "human" ? "未启用" : (appState.aiThinking ? "思考中..." : "待命");
    lastMoveEl.textContent = "最近一步：" +
      (appState.moveHistory.length ? appState.moveHistory[appState.moveHistory.length - 1] : "暂无");
    gameMessageEl.textContent = buildGameMessage(status);
    undoBtnEl.disabled = appState.history.length <= 1 || appState.aiThinking;
    difficultySelectEl.disabled = appState.mode !== "ai";
    playerColorSelectEl.disabled = appState.mode !== "ai";
    renderMoveList();

    if (appState.pendingPromotion) {
      setMessage("兵到达底线，请选择升变棋子。");
    }
  }

  modeSelectEl.addEventListener("change", function (event) {
    appState.mode = event.target.value;
    resetGame();
  });

  difficultySelectEl.addEventListener("change", function (event) {
    appState.difficulty = event.target.value;
    render();
  });

  playerColorSelectEl.addEventListener("change", function (event) {
    appState.playerColor = event.target.value;
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
  render();
  maybeRunAI();
}());
