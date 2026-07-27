window.CP = window.CP || {
  shouldStopExecution: function () {
    return false;
  },
  exitedLoop: function () {},
};

var wrong = document.getElementById("wrong");
var correct = document.getElementById("correct");
var theme = document.getElementById("theme");
theme.loop = false;

function play() {
  theme.play();
}

function pause() {
  theme.pause();
}

function resetWrong() {
  renderWrongMarks(0);
  $("#wrongScore").html("0");
}

// Renders `count` copies of wrong.png side by side in the per-team strike
// indicator, instead of swapping in separate wrong2.png / wrong3.png files.
function renderWrongMarks(count) {
  var container = $("#wrongImagePerTeam");
  container.empty();
  for (var i = 0; i < count; i++) {
    $("<img>", { src: domain + "public/images/wrong.png", alt: "" }).appendTo(
      container,
    );
  }
  container.css("display", count > 0 ? "flex" : "none");
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateValue(from, to, duration, onUpdate, onComplete) {
  var startTime = null;
  function step(timestamp) {
    if (startTime === null) startTime = timestamp;
    var elapsed = timestamp - startTime;
    var progress = Math.min(elapsed / duration, 1);
    var eased = easeOutCubic(progress);
    var value = from + (to - from) * eased;
    onUpdate(value);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else if (typeof onComplete === "function") {
      onComplete();
    }
  }
  requestAnimationFrame(step);
}

function awardPoints(teamNum) {
  app.board.find("#awardTeam" + teamNum).click();
}

function showCard(cardNum) {
  app.board.find("#card_" + cardNum).click();
}

function showQuestion() {
  app.showQuestion();
}

console.log("Game Start!");
