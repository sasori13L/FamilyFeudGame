var app = {
  currentQ: 0,
  allData: [],
  board: $(
    "<div class='gameBoard playersBoard'>" +
      "<div class='score' id='boardScore'>0</div>" +
      "<div class='score' id='team1'>0</div>" +
      "<div class='score' data-team='1' id='teamLabel1'>Team A</div>" +
      "<div class='score' id='team2'>0</div>" +
      "<div class='score' data-team='2' id='teamLabel2'>Team B</div>" +
      "<div id='wrongScore' class='score button' hidden>0</div>" +
      "<div data-team='1' id='awardTeam1' hidden></div>" +
      "<div data-team='2' id='awardTeam2' hidden></div>" +
      "<div class='questionHolder'>" +
      "<div class='questionHide'><span class='questionNumber'></span></div>" +
      "<span class='question'></span></div>" +
      "<div class='colHolder'><div class='col1'></div><div class='col2'></div></div>" +
      "</div>",
  ),

  loadState: function () {
    try {
      return JSON.parse(localStorage.getItem("feudGameState"));
    } catch (e) {
      return null;
    }
  },

  loadQuestions: function () {
    var data = questionsData;
    var customData = localStorage.getItem("feudQuestionsData");
    if (customData) {
      try {
        var parsed = JSON.parse(customData);
        if (!validateQuestionsData(parsed)) data = parsed;
        else {
          console.warn("Saved custom questions failed validation; using defaults.");
        }
      } catch (e) {
        console.warn("Saved custom questions were invalid; using defaults.", e);
      }
    }
    app.jsonLoaded(data, app.loadState());
  },

  jsonLoaded: function (data, state) {
    app.allData = data.rounds;
    app.currentQ = state && app.allData[state.currentQ] ? state.currentQ : 0;
    app.makeQuestion(app.currentQ);
    if (!app.board.parent().length) $("body").append(app.board);
    app.board.append($("#wrongImagePerTeam"));
    if (state) app.applyGameState(state);
  },

  makeQuestion: function (questionIndex) {
    var round = app.allData[questionIndex];
    if (!round) return;

    var answerCount = Math.max(8, round.answers.length);
    if (answerCount % 2) answerCount++;
    var col1 = app.board.find(".col1").empty();
    var col2 = app.board.find(".col2").empty();
    app.board.find("#boardScore").text(0);
    app.board.find(".questionHide").show();
    app.board.find(".question").text(round.question.replace(/&x22;/gi, '"'));
    app.board
      .find(".questionNumber")
      .text(
        questionIndex === app.allData.length - 1
          ? "Last Round"
          : "Round #" + (questionIndex + 1),
      );

    for (var i = 0; i < answerCount; i++) {
      var item = round.answers[i]
        ? buildAnswerCard(round.answers[i], i, false)
        : $("<div class='cardHolder empty'><div></div></div>");
      (i < answerCount / 2 ? col1 : col2).append(item);
    }
    requestAnimationFrame(fitPlayersBoard);
  },

  applyGameState: function (state) {
    if (!state || !app.allData[state.currentQ]) return;
    if (app.currentQ !== state.currentQ) {
      app.currentQ = state.currentQ;
      app.makeQuestion(app.currentQ);
    }

    app.board.find("#team1").text(Number(state.team1) || 0);
    app.board.find("#team2").text(Number(state.team2) || 0);
    var wrongCount = Math.max(0, Math.min(3, Number(state.wrong) || 0));
    app.board.find("#wrongScore").text(wrongCount);
    renderWrongMarks(wrongCount);
    if (state.team1Name) app.applyTeamName("1", state.team1Name);
    if (state.team2Name) app.applyTeamName("2", state.team2Name);

    app.board.find(".card").each(function (index) {
      var revealed =
        Array.isArray(state.revealedCards) &&
        state.revealedCards.indexOf(index) !== -1;
      $(this).data("flipped", revealed).toggleClass("flipped", revealed);
    });
    app.board.find("#boardScore").text(Number(state.roundScore) || 0);
    app.board.find(".questionHide").toggle(!state.questionVisible);
  },

  applyTeamName: function (teamNumber, name) {
    app.board.find("#teamLabel" + teamNumber).text(name);
    app.board.find("#awardTeam" + teamNumber).text(name);
  },

  init: function () {
    app.loadQuestions();
  },
};

app.init();

function fitPlayersBoard() {
  var board = app.board && app.board[0];
  var page = document.querySelector(".playersPage");
  if (!board || !board.isConnected || !page) return;

  var width = board.offsetWidth;
  var height = board.offsetHeight;
  if (!width || !height) return;

  var availableWidth = Math.max(1, page.clientWidth - 12);
  var availableHeight = Math.max(1, page.clientHeight - 12);
  var scale = Math.min(availableWidth / width, availableHeight / height);
  board.style.setProperty("--fit-scale", String(scale));
}

requestAnimationFrame(fitPlayersBoard);
window.addEventListener("resize", fitPlayersBoard);

function setLockScreen(active) {
  $("#lockScreen").toggleClass("active", active);
}

setLockScreen(localStorage.getItem("feudLockScreen") === "true");

function reloadQuestions() {
  var data = questionsData;
  var customData = localStorage.getItem("feudQuestionsData");
  if (customData) {
    try {
      var parsed = JSON.parse(customData);
      if (!validateQuestionsData(parsed)) data = parsed;
    } catch (e) {
      console.warn("Could not load imported question data; using defaults.", e);
    }
  }
  app.currentQ = 0;
  app.jsonLoaded(data, null);
  app.board.find("#team1, #team2, #wrongScore, #boardScore").text(0);
  renderWrongMarks(0);
  app.applyTeamName("1", "Team 1");
  app.applyTeamName("2", "Team 2");
}

window.addEventListener("storage", function (event) {
  if (event.key === "feudGameState" && event.newValue) {
    try {
      app.applyGameState(JSON.parse(event.newValue));
    } catch (e) {
      console.warn("Could not apply synchronized game state:", e);
    }
  } else if (event.key === "feudQuestionsData") {
    reloadQuestions();
  } else if (event.key === "feudLockScreen") {
    setLockScreen(event.newValue === "true");
  }
});
