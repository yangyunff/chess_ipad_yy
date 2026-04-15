var fso = new ActiveXObject("Scripting.FileSystemObject");
var engineSource = fso.OpenTextFile("engine.js", 1).ReadAll();
eval(engineSource);

function assert(condition, message) {
  if (!condition) {
    WScript.Echo("FAIL: " + message);
    WScript.Quit(1);
  }
  WScript.Echo("PASS: " + message);
}

function playMoves(sequence) {
  var state = ChessEngine.createGame();
  var i;
  var legalMoves;
  var move;
  var targetNotation;
  var j;

  for (i = 0; i < sequence.length; i += 1) {
    legalMoves = ChessEngine.generateLegalMoves(state, state.turn);
    targetNotation = sequence[i];
    move = null;
    for (j = 0; j < legalMoves.length; j += 1) {
      if (ChessEngine.moveToNotation(legalMoves[j]) === targetNotation) {
        move = legalMoves[j];
        break;
      }
    }
    assert(!!move, "Found move " + targetNotation);
    state = ChessEngine.makeMove(state, move);
  }
  return state;
}

var openingState = ChessEngine.createGame();
assert(ChessEngine.generateLegalMoves(openingState, "w").length === 20, "Opening position has 20 legal moves for white");

openingState = ChessEngine.makeMove(openingState, {
  from: ChessEngine.squareToIndex("e2"),
  to: ChessEngine.squareToIndex("e4"),
  piece: "wp",
  captured: null,
  isPawnDouble: true
});
assert(openingState.turn === "b", "Turn switches to black after white moves");

var mateState = playMoves(["f2-f3", "e7-e5", "g2-g4", "d8-h4"]);
assert(ChessEngine.getGameStatus(mateState).result === "checkmate", "Fool's mate is detected as checkmate");

var aiState = ChessEngine.createGame();
var aiMove = ChessEngine.findBestMove(aiState, "medium", "w");
assert(!!aiMove, "AI finds a legal opening move");
WScript.Echo("All engine tests passed.");
