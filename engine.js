(function (global) {
  var FILES = "abcdefgh";
  var PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  };
  var KNIGHT_OFFSETS = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  var KING_OFFSETS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  var BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  var ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  var PIECE_SQUARE_TABLES = {
    p: [
      0, 0, 0, 0, 0, 0, 0, 0,
      50, 50, 50, 50, 50, 50, 50, 50,
      10, 10, 20, 30, 30, 20, 10, 10,
      5, 5, 10, 25, 25, 10, 5, 5,
      0, 0, 0, 20, 20, 0, 0, 0,
      5, -5, -10, 0, 0, -10, -5, 5,
      5, 10, 10, -20, -20, 10, 10, 5,
      0, 0, 0, 0, 0, 0, 0, 0
    ],
    n: [
      -50, -40, -30, -30, -30, -30, -40, -50,
      -40, -20, 0, 5, 5, 0, -20, -40,
      -30, 5, 10, 15, 15, 10, 5, -30,
      -30, 0, 15, 20, 20, 15, 0, -30,
      -30, 5, 15, 20, 20, 15, 5, -30,
      -30, 0, 10, 15, 15, 10, 0, -30,
      -40, -20, 0, 0, 0, 0, -20, -40,
      -50, -40, -30, -30, -30, -30, -40, -50
    ],
    b: [
      -20, -10, -10, -10, -10, -10, -10, -20,
      -10, 5, 0, 0, 0, 0, 5, -10,
      -10, 10, 10, 10, 10, 10, 10, -10,
      -10, 0, 10, 10, 10, 10, 0, -10,
      -10, 5, 5, 10, 10, 5, 5, -10,
      -10, 0, 5, 10, 10, 5, 0, -10,
      -10, 0, 0, 0, 0, 0, 0, -10,
      -20, -10, -10, -10, -10, -10, -10, -20
    ],
    r: [
      0, 0, 0, 5, 5, 0, 0, 0,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      5, 10, 10, 10, 10, 10, 10, 5,
      0, 0, 0, 0, 0, 0, 0, 0
    ],
    q: [
      -20, -10, -10, -5, -5, -10, -10, -20,
      -10, 0, 0, 0, 0, 0, 0, -10,
      -10, 0, 5, 5, 5, 5, 0, -10,
      -5, 0, 5, 5, 5, 5, 0, -5,
      0, 0, 5, 5, 5, 5, 0, -5,
      -10, 5, 5, 5, 5, 5, 0, -10,
      -10, 0, 5, 0, 0, 0, 0, -10,
      -20, -10, -10, -5, -5, -10, -10, -20
    ],
    k: [
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -20, -30, -30, -40, -40, -30, -30, -20,
      -10, -20, -20, -20, -20, -20, -20, -10,
      20, 20, 0, 0, 0, 0, 20, 20,
      20, 30, 10, 0, 0, 10, 30, 20
    ]
  };

  function createInitialBoard() {
    var board = new Array(64);
    var backRank = ["r", "n", "b", "q", "k", "b", "n", "r"];
    var i;
    for (i = 0; i < 8; i += 1) {
      board[i] = "b" + backRank[i];
      board[8 + i] = "bp";
      board[48 + i] = "wp";
      board[56 + i] = "w" + backRank[i];
    }
    return board;
  }

  function createGame() {
    return {
      board: createInitialBoard(),
      turn: "w",
      castling: { wk: true, wq: true, bk: true, bq: true },
      enPassant: null,
      halfmoveClock: 0,
      fullmoveNumber: 1,
      lastMove: null
    };
  }

  function shallowCopy(source) {
    var target = {};
    var key;
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
    return target;
  }

  function cloneState(state) {
    return {
      board: state.board.slice(0),
      turn: state.turn,
      castling: {
        wk: state.castling.wk,
        wq: state.castling.wq,
        bk: state.castling.bk,
        bq: state.castling.bq
      },
      enPassant: state.enPassant,
      halfmoveClock: state.halfmoveClock,
      fullmoveNumber: state.fullmoveNumber,
      lastMove: state.lastMove ? shallowCopy(state.lastMove) : null
    };
  }

  function indexToCoord(index) {
    return {
      row: Math.floor(index / 8),
      col: index % 8
    };
  }

  function coordToIndex(row, col) {
    return row * 8 + col;
  }

  function squareName(index) {
    var coord = indexToCoord(index);
    return FILES.charAt(coord.col) + String(8 - coord.row);
  }

  function squareToIndex(square) {
    var file = FILES.indexOf(square.charAt(0));
    var rank = parseInt(square.charAt(1), 10);
    return coordToIndex(8 - rank, file);
  }

  function isInside(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  function getColor(piece) {
    return piece ? piece.charAt(0) : null;
  }

  function getType(piece) {
    return piece ? piece.charAt(1) : null;
  }

  function opposite(color) {
    return color === "w" ? "b" : "w";
  }

  function findKing(state, color) {
    var i;
    for (i = 0; i < 64; i += 1) {
      if (state.board[i] === color + "k") {
        return i;
      }
    }
    return null;
  }

  function scanForAttack(state, row, col, attackerColor, directions, allowedTypes) {
    var i;
    var nextRow;
    var nextCol;
    var piece;
    var pieceType;

    for (i = 0; i < directions.length; i += 1) {
      nextRow = row + directions[i][0];
      nextCol = col + directions[i][1];
      while (isInside(nextRow, nextCol)) {
        piece = state.board[coordToIndex(nextRow, nextCol)];
        if (piece) {
          if (getColor(piece) === attackerColor) {
            pieceType = getType(piece);
            if (allowedTypes[0] === pieceType || allowedTypes[1] === pieceType) {
              return true;
            }
          }
          break;
        }
        nextRow += directions[i][0];
        nextCol += directions[i][1];
      }
    }

    return false;
  }

  function isSquareAttacked(state, target, attackerColor) {
    var coord = indexToCoord(target);
    var pawnRow = coord.row + (attackerColor === "w" ? 1 : -1);
    var pawnCols = [coord.col - 1, coord.col + 1];
    var i;
    var row;
    var col;
    var piece;

    for (i = 0; i < pawnCols.length; i += 1) {
      if (isInside(pawnRow, pawnCols[i])) {
        piece = state.board[coordToIndex(pawnRow, pawnCols[i])];
        if (piece === attackerColor + "p") {
          return true;
        }
      }
    }

    for (i = 0; i < KNIGHT_OFFSETS.length; i += 1) {
      row = coord.row + KNIGHT_OFFSETS[i][0];
      col = coord.col + KNIGHT_OFFSETS[i][1];
      if (isInside(row, col) && state.board[coordToIndex(row, col)] === attackerColor + "n") {
        return true;
      }
    }

    if (scanForAttack(state, coord.row, coord.col, attackerColor, BISHOP_DIRS, ["b", "q"])) {
      return true;
    }
    if (scanForAttack(state, coord.row, coord.col, attackerColor, ROOK_DIRS, ["r", "q"])) {
      return true;
    }

    for (i = 0; i < KING_OFFSETS.length; i += 1) {
      row = coord.row + KING_OFFSETS[i][0];
      col = coord.col + KING_OFFSETS[i][1];
      if (isInside(row, col) && state.board[coordToIndex(row, col)] === attackerColor + "k") {
        return true;
      }
    }

    return false;
  }

  function isInCheck(state, color) {
    return isSquareAttacked(state, findKing(state, color), opposite(color));
  }

  function generateLegalMoves(state, color) {
    var activeColor = color || state.turn;
    var moves = [];
    var i;
    var piece;
    var pseudoMoves;
    var j;
    var candidate;
    var nextState;

    for (i = 0; i < 64; i += 1) {
      piece = state.board[i];
      if (piece && getColor(piece) === activeColor) {
        pseudoMoves = generatePseudoMoves(state, i);
        for (j = 0; j < pseudoMoves.length; j += 1) {
          candidate = pseudoMoves[j];
          nextState = makeMove(state, candidate);
          if (!isInCheck(nextState, activeColor)) {
            moves.push(candidate);
          }
        }
      }
    }

    return moves;
  }

  function generatePseudoMoves(state, from) {
    var piece = state.board[from];
    var type = getType(piece);
    if (!piece) {
      return [];
    }
    if (type === "p") {
      return generatePawnMoves(state, from, piece);
    }
    if (type === "n") {
      return generateLeaperMoves(state, from, piece, KNIGHT_OFFSETS);
    }
    if (type === "b") {
      return generateSliderMoves(state, from, piece, BISHOP_DIRS);
    }
    if (type === "r") {
      return generateSliderMoves(state, from, piece, ROOK_DIRS);
    }
    if (type === "q") {
      return generateSliderMoves(state, from, piece, BISHOP_DIRS.concat(ROOK_DIRS));
    }
    return generateKingMoves(state, from, piece);
  }

  function pushPawnMove(moves, from, to, piece, captured, isPromotion) {
    var promotions;
    var i;
    if (isPromotion) {
      promotions = ["q", "r", "b", "n"];
      for (i = 0; i < promotions.length; i += 1) {
        moves.push({
          from: from,
          to: to,
          piece: piece,
          captured: captured || null,
          promotion: promotions[i]
        });
      }
      return;
    }
    moves.push({
      from: from,
      to: to,
      piece: piece,
      captured: captured || null
    });
  }

  function generatePawnMoves(state, from, piece) {
    var moves = [];
    var color = getColor(piece);
    var coord = indexToCoord(from);
    var dir = color === "w" ? -1 : 1;
    var startRow = color === "w" ? 6 : 1;
    var promotionRow = color === "w" ? 0 : 7;
    var nextRow = coord.row + dir;
    var forwardIndex;
    var captureCols;
    var i;
    var targetIndex;
    var targetPiece;

    if (isInside(nextRow, coord.col)) {
      forwardIndex = coordToIndex(nextRow, coord.col);
      if (!state.board[forwardIndex]) {
        pushPawnMove(moves, from, forwardIndex, piece, null, nextRow === promotionRow);
        if (coord.row === startRow) {
          targetIndex = coordToIndex(coord.row + dir * 2, coord.col);
          if (!state.board[targetIndex]) {
            moves.push({
              from: from,
              to: targetIndex,
              piece: piece,
              captured: null,
              isPawnDouble: true
            });
          }
        }
      }
    }

    captureCols = [coord.col - 1, coord.col + 1];
    for (i = 0; i < captureCols.length; i += 1) {
      if (!isInside(nextRow, captureCols[i])) {
        continue;
      }
      targetIndex = coordToIndex(nextRow, captureCols[i]);
      targetPiece = state.board[targetIndex];
      if (targetPiece && getColor(targetPiece) !== color) {
        pushPawnMove(moves, from, targetIndex, piece, targetPiece, nextRow === promotionRow);
      } else if (state.enPassant === targetIndex) {
        moves.push({
          from: from,
          to: targetIndex,
          piece: piece,
          captured: color === "w" ? "bp" : "wp",
          isEnPassant: true
        });
      }
    }

    return moves;
  }

  function generateLeaperMoves(state, from, piece, offsets) {
    var moves = [];
    var color = getColor(piece);
    var coord = indexToCoord(from);
    var i;
    var row;
    var col;
    var targetIndex;
    var targetPiece;

    for (i = 0; i < offsets.length; i += 1) {
      row = coord.row + offsets[i][0];
      col = coord.col + offsets[i][1];
      if (!isInside(row, col)) {
        continue;
      }
      targetIndex = coordToIndex(row, col);
      targetPiece = state.board[targetIndex];
      if (!targetPiece || getColor(targetPiece) !== color) {
        moves.push({
          from: from,
          to: targetIndex,
          piece: piece,
          captured: targetPiece || null
        });
      }
    }

    return moves;
  }

  function generateSliderMoves(state, from, piece, directions) {
    var moves = [];
    var color = getColor(piece);
    var coord = indexToCoord(from);
    var i;
    var row;
    var col;
    var targetIndex;
    var targetPiece;

    for (i = 0; i < directions.length; i += 1) {
      row = coord.row + directions[i][0];
      col = coord.col + directions[i][1];
      while (isInside(row, col)) {
        targetIndex = coordToIndex(row, col);
        targetPiece = state.board[targetIndex];
        if (!targetPiece) {
          moves.push({
            from: from,
            to: targetIndex,
            piece: piece,
            captured: null
          });
        } else {
          if (getColor(targetPiece) !== color) {
            moves.push({
              from: from,
              to: targetIndex,
              piece: piece,
              captured: targetPiece
            });
          }
          break;
        }
        row += directions[i][0];
        col += directions[i][1];
      }
    }

    return moves;
  }

  function generateKingMoves(state, from, piece) {
    var moves = generateLeaperMoves(state, from, piece, KING_OFFSETS);
    var color = getColor(piece);
    var enemy = opposite(color);
    var homeRow = color === "w" ? 7 : 0;
    var fromIndex = coordToIndex(homeRow, 4);

    if (from !== fromIndex || isInCheck(state, color)) {
      return moves;
    }

    if (color === "w" && state.castling.wk &&
      !state.board[coordToIndex(homeRow, 5)] &&
      !state.board[coordToIndex(homeRow, 6)] &&
      state.board[coordToIndex(homeRow, 7)] === "wr" &&
      !isSquareAttacked(state, coordToIndex(homeRow, 5), enemy) &&
      !isSquareAttacked(state, coordToIndex(homeRow, 6), enemy)) {
      moves.push({ from: from, to: coordToIndex(homeRow, 6), piece: piece, captured: null, castle: "k" });
    }

    if (color === "w" && state.castling.wq &&
      !state.board[coordToIndex(homeRow, 1)] &&
      !state.board[coordToIndex(homeRow, 2)] &&
      !state.board[coordToIndex(homeRow, 3)] &&
      state.board[coordToIndex(homeRow, 0)] === "wr" &&
      !isSquareAttacked(state, coordToIndex(homeRow, 3), enemy) &&
      !isSquareAttacked(state, coordToIndex(homeRow, 2), enemy)) {
      moves.push({ from: from, to: coordToIndex(homeRow, 2), piece: piece, captured: null, castle: "q" });
    }

    if (color === "b" && state.castling.bk &&
      !state.board[coordToIndex(homeRow, 5)] &&
      !state.board[coordToIndex(homeRow, 6)] &&
      state.board[coordToIndex(homeRow, 7)] === "br" &&
      !isSquareAttacked(state, coordToIndex(homeRow, 5), enemy) &&
      !isSquareAttacked(state, coordToIndex(homeRow, 6), enemy)) {
      moves.push({ from: from, to: coordToIndex(homeRow, 6), piece: piece, captured: null, castle: "k" });
    }

    if (color === "b" && state.castling.bq &&
      !state.board[coordToIndex(homeRow, 1)] &&
      !state.board[coordToIndex(homeRow, 2)] &&
      !state.board[coordToIndex(homeRow, 3)] &&
      state.board[coordToIndex(homeRow, 0)] === "br" &&
      !isSquareAttacked(state, coordToIndex(homeRow, 3), enemy) &&
      !isSquareAttacked(state, coordToIndex(homeRow, 2), enemy)) {
      moves.push({ from: from, to: coordToIndex(homeRow, 2), piece: piece, captured: null, castle: "q" });
    }

    return moves;
  }

  function updateCastlingRights(state, move, piece, capturedPiece) {
    var from = move.from;
    var to = move.to;
    var pieceColor = getColor(piece);
    var pieceType = getType(piece);

    if (pieceType === "k") {
      if (pieceColor === "w") {
        state.castling.wk = false;
        state.castling.wq = false;
      } else {
        state.castling.bk = false;
        state.castling.bq = false;
      }
    }

    if (pieceType === "r") {
      if (from === squareToIndex("h1")) {
        state.castling.wk = false;
      } else if (from === squareToIndex("a1")) {
        state.castling.wq = false;
      } else if (from === squareToIndex("h8")) {
        state.castling.bk = false;
      } else if (from === squareToIndex("a8")) {
        state.castling.bq = false;
      }
    }

    if (capturedPiece === "wr") {
      if (to === squareToIndex("h1")) {
        state.castling.wk = false;
      } else if (to === squareToIndex("a1")) {
        state.castling.wq = false;
      }
    } else if (capturedPiece === "br") {
      if (to === squareToIndex("h8")) {
        state.castling.bk = false;
      } else if (to === squareToIndex("a8")) {
        state.castling.bq = false;
      }
    }
  }

  function makeMove(state, move) {
    var next = cloneState(state);
    var piece = next.board[move.from];
    var pieceColor = getColor(piece);
    var pieceType = getType(piece);
    var toCoord = indexToCoord(move.to);
    var capturedPiece = move.captured || next.board[move.to] || null;

    next.board[move.from] = null;

    if (move.isEnPassant) {
      next.board[coordToIndex(pieceColor === "w" ? toCoord.row + 1 : toCoord.row - 1, toCoord.col)] = null;
    }

    if (move.castle) {
      if (move.castle === "k") {
        next.board[move.to] = piece;
        next.board[coordToIndex(toCoord.row, 5)] = pieceColor + "r";
        next.board[coordToIndex(toCoord.row, 7)] = null;
      } else {
        next.board[move.to] = piece;
        next.board[coordToIndex(toCoord.row, 3)] = pieceColor + "r";
        next.board[coordToIndex(toCoord.row, 0)] = null;
      }
    } else {
      next.board[move.to] = move.promotion ? pieceColor + move.promotion : piece;
    }

    updateCastlingRights(next, move, piece, capturedPiece);
    next.enPassant = null;

    if (pieceType === "p" && move.isPawnDouble) {
      next.enPassant = coordToIndex((indexToCoord(move.from).row + toCoord.row) / 2, toCoord.col);
    }

    next.halfmoveClock = (pieceType === "p" || capturedPiece) ? 0 : next.halfmoveClock + 1;
    if (pieceColor === "b") {
      next.fullmoveNumber += 1;
    }

    next.turn = opposite(state.turn);
    next.lastMove = shallowCopy(move);
    return next;
  }

  function isInsufficientMaterial(state) {
    var pieces = [];
    var i;
    var piece;
    var type;

    for (i = 0; i < 64; i += 1) {
      piece = state.board[i];
      if (piece) {
        pieces.push(piece);
      }
    }

    if (pieces.length === 2) {
      return true;
    }

    if (pieces.length === 3) {
      for (i = 0; i < pieces.length; i += 1) {
        type = getType(pieces[i]);
        if (type === "b" || type === "n") {
          return true;
        }
      }
    }

    return false;
  }

  function getGameStatus(state) {
    var legalMoves = generateLegalMoves(state, state.turn);
    var inCheck = isInCheck(state, state.turn);
    var winner = null;
    var result = "playing";
    var message = "Game in progress";

    if (legalMoves.length === 0) {
      if (inCheck) {
        winner = opposite(state.turn);
        result = "checkmate";
        message = (winner === "w" ? "White" : "Black") + " wins by checkmate";
      } else {
        result = "stalemate";
        message = "Draw by stalemate";
      }
    } else if (state.halfmoveClock >= 100) {
      result = "draw";
      message = "Draw by fifty-move rule";
    } else if (isInsufficientMaterial(state)) {
      result = "draw";
      message = "Draw by insufficient material";
    } else if (inCheck) {
      message = (state.turn === "w" ? "White" : "Black") + " is in check";
    }

    return {
      result: result,
      winner: winner,
      message: message,
      inCheck: inCheck,
      legalMoves: legalMoves
    };
  }

  function mirrorIndex(index) {
    var coord = indexToCoord(index);
    return coordToIndex(7 - coord.row, coord.col);
  }

  function mobilityBonus(state, aiColor) {
    var myMoves = generateLegalMoves(state, aiColor).length;
    var opponentMoves = generateLegalMoves(state, opposite(aiColor)).length;
    return (myMoves - opponentMoves) * 4;
  }

  function evaluateBoard(state, aiColor) {
    var score = 0;
    var i;
    var piece;
    var color;
    var type;
    var status;

    for (i = 0; i < 64; i += 1) {
      piece = state.board[i];
      if (!piece) {
        continue;
      }
      color = getColor(piece);
      type = getType(piece);
      score += (color === aiColor ? 1 : -1) *
        (PIECE_VALUES[type] + PIECE_SQUARE_TABLES[type][color === "w" ? i : mirrorIndex(i)]);
    }

    status = getGameStatus(state);
    if (status.result === "checkmate") {
      return status.winner === aiColor ? 999999 : -999999;
    }
    if (status.result === "stalemate" || status.result === "draw") {
      return 0;
    }

    return score + mobilityBonus(state, aiColor);
  }

  function scoreMove(move) {
    var score = 0;
    if (move.captured) {
      score += PIECE_VALUES[getType(move.captured)] - PIECE_VALUES[getType(move.piece)] / 10;
    }
    if (move.promotion) {
      score += PIECE_VALUES[move.promotion];
    }
    if (move.castle) {
      score += 40;
    }
    return score;
  }

  function orderMoves(moves) {
    var sorted = moves.slice(0);
    sorted.sort(function (a, b) {
      return scoreMove(b) - scoreMove(a);
    });
    return sorted;
  }

  function getDifficultyConfig(level) {
    if (level === "easy") {
      return { depth: 1, breadth: 8, randomness: 0.6 };
    }
    if (level === "hard") {
      return { depth: 3, breadth: 20, randomness: 0 };
    }
    return { depth: 2, breadth: 12, randomness: 0.15 };
  }

  function minimax(state, depth, alpha, beta, maximizing, aiColor, breadth) {
    var status = getGameStatus(state);
    var legalMoves;
    var i;
    var value;
    var nextState;

    if (depth <= 0 || status.result !== "playing") {
      return evaluateBoard(state, aiColor);
    }

    legalMoves = orderMoves(generateLegalMoves(state, state.turn));
    legalMoves = legalMoves.slice(0, Math.min(breadth, legalMoves.length));

    if (maximizing) {
      value = -Infinity;
      for (i = 0; i < legalMoves.length; i += 1) {
        nextState = makeMove(state, legalMoves[i]);
        value = Math.max(value, minimax(nextState, depth - 1, alpha, beta, false, aiColor, breadth));
        alpha = Math.max(alpha, value);
        if (beta <= alpha) {
          break;
        }
      }
      return value;
    }

    value = Infinity;
    for (i = 0; i < legalMoves.length; i += 1) {
      nextState = makeMove(state, legalMoves[i]);
      value = Math.min(value, minimax(nextState, depth - 1, alpha, beta, true, aiColor, breadth));
      beta = Math.min(beta, value);
      if (beta <= alpha) {
        break;
      }
    }
    return value;
  }

  function findBestMove(state, level, aiColor) {
    var config = getDifficultyConfig(level || "medium");
    var legalMoves = orderMoves(generateLegalMoves(state, aiColor));
    var bestScore = -Infinity;
    var bestMove = null;
    var shortlist = [];
    var i;
    var candidate;
    var nextState;
    var score;

    if (!legalMoves.length) {
      return null;
    }

    if (config.depth === 1 && config.randomness > 0.5) {
      shortlist = legalMoves.slice(0, Math.min(6, legalMoves.length));
      return shallowCopy(shortlist[Math.floor(Math.random() * shortlist.length)]);
    }

    legalMoves = legalMoves.slice(0, Math.min(config.breadth, legalMoves.length));
    for (i = 0; i < legalMoves.length; i += 1) {
      candidate = legalMoves[i];
      nextState = makeMove(state, candidate);
      score = minimax(nextState, config.depth - 1, -Infinity, Infinity, false, aiColor, config.breadth);
      if (score > bestScore || !bestMove) {
        bestScore = score;
        bestMove = candidate;
      }
      if (score >= bestScore - 45) {
        shortlist.push(candidate);
      }
    }

    if (config.randomness > 0 && shortlist.length > 1 && Math.random() < config.randomness) {
      bestMove = shortlist[Math.floor(Math.random() * shortlist.length)];
    }

    return shallowCopy(bestMove);
  }

  function moveToNotation(move) {
    if (move.castle === "k") {
      return "O-O";
    }
    if (move.castle === "q") {
      return "O-O-O";
    }
    return squareName(move.from) + (move.captured ? "x" : "-") + squareName(move.to) +
      (move.promotion ? "=" + move.promotion.toUpperCase() : "");
  }

  global.ChessEngine = {
    createGame: createGame,
    cloneState: cloneState,
    generateLegalMoves: generateLegalMoves,
    getGameStatus: getGameStatus,
    makeMove: makeMove,
    findBestMove: findBestMove,
    squareName: squareName,
    squareToIndex: squareToIndex,
    moveToNotation: moveToNotation,
    isInCheck: isInCheck,
    opposite: opposite
  };
}(this));
