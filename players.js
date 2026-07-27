var team1 = "Team A";
var team2 = "Team B";
var app = {
  version: 1,
  currentQ: 0,
  jsonFile: "Questions.json",
  board: $(
    "<div class='gameBoard playersBoard'>" +
      "<!--- Scores --->" +
      "<div class='score' id='boardScore'>0</div>" +
      "<div class='score' id='team1'>0</div>" +
      "<div class='score' data-team='1' id='teamLabel1' >" +
      team1 +
      "</div>" +
      "<div class='score' id='team2'>0</div>" +
      "<div class='score' data-team='2' id='teamLabel2' >" +
      team2 +
      "</div>" +
      "<div id='wrongScore' class='score button' hidden>0</div>" +
      "<!--- Question --->" +
      "<div class='questionHolder'>" +
      "<div class='questionHide'>" +
      "<span class='questionNumber'></span>" +
      "</div>" +
      "<span class='question'></span>" +
      "</div>" +
      "<!--- Answers --->" +
      "<div class='colHolder'>" +
      "<div class='col1'></div>" +
      "<div class='col2'></div>" +
      "</div>" +
      "</div>",
  ),
  // Utility functions
  shuffle: function (array) {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex;
    while (0 !== currentIndex) {
      if (window.CP.shouldStopExecution(0)) break;
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    window.CP.exitedLoop(0);
    return array;
  },
  saveState: function () {
    var state = {
      currentQ: app.currentQ,
      team1: parseInt(app.board.find("#team1").html()) || 0,
      team2: parseInt(app.board.find("#team2").html()) || 0,
      wrong: parseInt(app.board.find("#wrongScore").html()) || 0,
      team1Name: app.board.find("#teamLabel1").text(),
      team2Name: app.board.find("#teamLabel2").text(),
    };
    localStorage.setItem("feudGameState", JSON.stringify(state));
  },
  loadState: function () {
    var saved = localStorage.getItem("feudGameState");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  },
  loadQuestions: function () {
    var customData = localStorage.getItem("feudQuestionsData");
    if (customData) {
      try {
        app.jsonLoaded(JSON.parse(customData));
        return;
      } catch (e) {
        console.warn(
          "Saved custom questions were invalid, falling back to default.",
          e,
        );
      }
    }
    if (typeof questionsData !== "undefined") {
      app.jsonLoaded(questionsData);
    } else {
      $.getJSON(app.jsonFile, app.jsonLoaded);
    }
  },
  jsonLoaded: function (data) {
    //console.clear();
    app.allData = data.rounds;
    app.questions = app.allData.map(function (r) {
      return r.question;
    });
    //app.shuffle(app.questions);
    var saved = app.loadState();
    if (
      saved &&
      typeof saved.currentQ === "number" &&
      app.allData[saved.currentQ]
    ) {
      app.currentQ = saved.currentQ;
    }
    app.makeQuestion(app.currentQ);
    $("body").append(app.board);
    if (saved) {
      app.board.find("#team1").html(saved.team1 || 0);
      app.board.find("#team2").html(saved.team2 || 0);
      app.board.find("#wrongScore").html(saved.wrong || 0);
      if (saved.wrong > 0) {
        renderWrongMarks(saved.wrong);
      }
      if (saved.team1Name) {
        app.applyTeamName("1", saved.team1Name);
      }
      if (saved.team2Name) {
        app.applyTeamName("2", saved.team2Name);
      }
    }
  },
  // Action functions
  makeQuestion: function (q) {
    resetWrong();
    app.hideQuestion();
    theme.pause();
    var round = app.allData[q];
    var qText = round.question;
    var qAnswr = round.answers.map(function (a) {
      return [a.answer, a.points];
    });

    var qNum = qAnswr.length;
    qNum = qNum < 8 ? 8 : qNum;
    qNum = qNum % 2 !== 0 ? qNum + 1 : qNum;

    var boardScore = app.board.find("#boardScore");
    var question = app.board.find(".question");
    var col1 = app.board.find(".col1");
    var col2 = app.board.find(".col2");

    boardScore.html(0);
    question.html(qText.replace(/&x22;/gi, '"'));
    col1.empty();
    col2.empty();

    for (var i = 0; i < qNum; i++) {
      if (window.CP.shouldStopExecution(1)) break;
      var aLI;
      if (qAnswr[i]) {
        aLI = $(
          "<div class='cardHolder' id='card_" +
            (i + 1) +
            "'>" +
            "<div class='card'>" +
            "<div class='front'>" +
            "<span class='DBG'>" +
            (i + 1) +
            "</span>" +
            "</div>" +
            "<div class='back DBG'>" +
            "<span>" +
            qAnswr[i][0] +
            "</span>" +
            "<b class='LBG'>" +
            qAnswr[i][1] +
            "</b>" +
            "</div>" +
            "</div>" +
            "</div>",
        );
      } else {
        aLI = $("<div class='cardHolder empty'><div></div></div>");
      }
      var parentDiv = i < qNum / 2 ? col1 : col2;
      $(aLI).appendTo(parentDiv);
    }
    window.CP.exitedLoop(1);

    var cardHolders = app.board.find(".cardHolder");
    var cards = app.board.find(".card");

    cards.data("flipped", false);

    function showCard() {
      var card = $(".card", this);
      var flipped = card.data("flipped");
      card.toggleClass("flipped");
      flipped = !flipped;
      card.data("flipped", flipped);
      app.getBoardScore();
      // correct.play();
    }

    cardHolders.on("click", showCard);

    var roundLabel =
      q === app.allData.length - 1
        ? "Last Round"
        : "Round #" + (app.currentQ + 1);
    app.board.find(".questionNumber").html(roundLabel);
  },
  getBoardScore: function () {
    var cards = app.board.find(".card");
    var boardScore = app.board.find("#boardScore");
    var currentVal = parseInt(boardScore.html()) || 0;
    var score = 0;

    function tallyScore() {
      if ($(this).data("flipped")) {
        var value = $(this).find("b").html();
        score += parseInt(value);
      }
    }

    $.each(cards, tallyScore);
    animateValue(currentVal, score, 1000, function (v) {
      boardScore.html(Math.round(v));
    });
  },
  awardPoints: function () {
    if (theme.paused) {
      // theme.play();
    }
    var num = $(this).attr("data-team");
    var boardScore = app.board.find("#boardScore");
    var currentScore = parseInt(boardScore.html()) || 0;
    var team = app.board.find("#team" + num);
    var teamScoreStart = parseInt(team.html()) || 0;
    var teamScoreUpdated = teamScoreStart + currentScore;

    if (currentScore) {
      console.log(
        "Question " +
          (app.currentQ + 1) +
          ": Team " +
          num +
          " [" +
          teamScoreStart +
          " + " +
          currentScore +
          "]" +
          " = " +
          teamScoreUpdated,
      );
    }

    animateValue(
      teamScoreStart,
      teamScoreUpdated,
      1000,
      function (v) {
        team.html(Math.round(v));
      },
      function () {
        app.saveState();
      },
    );

    animateValue(currentScore, 0, 1000, function (v) {
      boardScore.html(Math.round(v));
    });
    //$("#newQuestion").click();
  },
  changeQuestion: function () {
    app.currentQ++;
    app.makeQuestion(app.currentQ);
    app.saveState();
  },
  addWrong: function () {
    // wrong.play();

    var scoreEl = app.board.find("#wrongScore");
    var wrongScore = { var: parseInt(scoreEl.html()) };
    if (wrongScore.var < 3) {
      scoreEl.html(wrongScore.var + 1);
      $("#wrongImage" + (wrongScore.var + 1))
        .show()
        .delay(1000)
        .fadeOut(500);
      renderWrongMarks(wrongScore.var + 1);
      console.log(
        "Question " +
          (app.currentQ + 1) +
          " Wrong: [" +
          wrongScore.var +
          " + 1] = " +
          (wrongScore.var + 1),
      );
      app.saveState();
    }
  },
  revertWrong: function () {
    var scoreEl = app.board.find("#wrongScore");
    var wrongScore = { var: parseInt(scoreEl.html()) };
    if (wrongScore.var > 0) {
      var newVal = wrongScore.var - 1;
      scoreEl.html(newVal);
      renderWrongMarks(newVal);
      console.log(
        "Question " + (app.currentQ + 1) + " Wrong reverted to " + newVal,
      );
      app.saveState();
    }
  },
  showQuestion: function () {
    if (app.board.find(".questionHide").is(":visible")) {
      app.board.find(".questionHide").hide();
    } else {
      app.board.find(".questionHide").show();
    }
  },
  hideQuestion: function () {
    app.board.find(".questionHide").show();
  },
  showControls: function () {
    if (app.board.find(".btnHolder").is(":visible")) {
      app.board.find(".btnHolder").hide();
    } else {
      app.board.find(".btnHolder").show();
    }
  },
  applyTeamName: function (num, name) {
    app.board.find("#teamLabel" + num).text(name);
    app.board.find("#awardTeam" + num).text(name);
  },
  // Initial function
  init: function () {
    app.loadQuestions();
    app.board.find("#newQuestion").on("click", app.changeQuestion);
    app.board.find("#teamLabel1").on("click", app.awardPoints);
    app.board.find("#teamLabel2").on("click", app.awardPoints);
    app.board.find("#awardTeam1").on("click", app.awardPoints);
    app.board.find("#awardTeam2").on("click", app.awardPoints);
    app.board.find("#wrongTeam").on("click", app.addWrong);
    app.board.find("#revertWrong").on("click", app.revertWrong);
    app.board.find(".questionHolder").on("click", app.showQuestion);
    app.board.find("#showControls").on("click", app.showControls);
  },
};

app.init();

function setLockScreen(active) {
  if (active) {
    $("#lockScreen").addClass("active");
  } else {
    $("#lockScreen").removeClass("active");
  }
}

setLockScreen(localStorage.getItem("feudLockScreen") === "true");

function adjustScore(teamNum, points) {
  var team = app.board.find("#team" + teamNum);
  team.html(Math.round(points));
  console.log("Adjusted team " + teamNum + " scores to " + points);
  app.saveState();
}

function adjustQuestion(questionNum) {
  app.currentQ = questionNum - 1;
  app.makeQuestion(app.currentQ);

  console.log("Adjusted question marker to " + (app.currentQ + 1));
  app.saveState();
}

function adjustWrong(points) {
  var scoreEl = app.board.find("#wrongScore");
  if (points >= 0 && points <= 3) {
    scoreEl.html(Math.round(points));
    if (points > 0) {
      $("#wrongImage" + points)
        .show()
        .delay(1000)
        .fadeOut(500);
    }
    renderWrongMarks(points);
  }
  console.log("Adjusted wrong count to " + points);
  app.saveState();
}

function addWrong() {
  // wrong.play();
  var scoreEl = app.board.find("#wrongScore");
  var wrongScore = { var: parseInt(scoreEl.html()) };
  adjustWrong(wrongScore.var + 1);
}

function revertWrong() {
  var scoreEl = app.board.find("#wrongScore");
  var wrongScore = { var: parseInt(scoreEl.html()) };
  adjustWrong(Math.max(0, wrongScore.var - 1));
}

function resetGame() {
  app.currentQ = 0;
  app.board.find("#team1").html(0);
  app.board.find("#team2").html(0);
  resetWrong();
  app.makeQuestion(app.currentQ);
  app.saveState();
}

function renameTeam(teamNum, name) {
  app.applyTeamName(teamNum, name);
  console.log("Renamed team " + teamNum + " to " + name);
  // Persist into feudGameState (not just the transient "teamName" signal key)
  // so the new name survives reloads / re-syncs of the players screen.
  app.saveState();
}

function reloadQuestions() {
  function applyData(data) {
    app.allData = data.rounds;
    app.questions = app.allData.map(function (r) {
      return r.question;
    });
    app.currentQ = 0;
    app.board.find("#team1").html(0);
    app.board.find("#team2").html(0);
    resetWrong();
    app.makeQuestion(app.currentQ);
    app.saveState();
  }
  var customData = localStorage.getItem("feudQuestionsData");
  if (customData) {
    try {
      applyData(JSON.parse(customData));
      return;
    } catch (e) {
      console.warn(
        "Saved custom questions were invalid, falling back to default.",
        e,
      );
    }
  }
  if (typeof questionsData !== "undefined") {
    applyData(questionsData);
  } else {
    $.getJSON(app.jsonFile, applyData);
  }
}

window.addEventListener("storage", function (event) {
  if (event.key === "showQuestion") {
    showQuestion();
  } else if (event.key === "changeQuestion") {
    app.changeQuestion();
  } else if (event.key === "hideQuestion") {
    app.hideQuestion();
  } else if (event.key === "awardPoints") {
    awardPoints(event.newValue[0]);
  } else if (event.key === "showCard") {
    showCard(event.newValue[5]);
  } else if (event.key === "adjustScore") {
    adjustScore(event.newValue[0], event.newValue[1]);
  } else if (event.key === "adjustQuestion") {
    adjustQuestion(event.newValue[0]);
  } else if (event.key === "adjustWrong") {
    adjustWrong(event.newValue[0]);
  } else if (event.key === "addWrong") {
    addWrong();
  } else if (event.key === "revertWrong") {
    revertWrong();
  } else if (event.key === "resetGame") {
    resetGame();
  } else if (event.key === "teamName") {
    try {
      var teamNamePayload = JSON.parse(event.newValue);
      renameTeam(teamNamePayload[0], teamNamePayload[1]);
    } catch (e) {
      console.warn("Could not parse teamName broadcast:", event.newValue, e);
    }
  } else if (event.key === "questionsImported") {
    reloadQuestions();
  } else if (event.key === "feudLockScreen") {
    setLockScreen(event.newValue === "true");
  }
});
