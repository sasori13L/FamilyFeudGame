var app = {
  version: 1,
  currentQ: 0,
  awardedCards: [],
  board: $(
    "<div class='gameBoard masterBoard'>" +
      "<!--- Scores --->" +
      "<div class='score' id='boardScore'>0</div>" +
      "<div class='score' id='team1' >0</div>" +
      "<div class='score' id='teamLabel1' >Team 1</div>" +
      "<div class='score' id='team2' >0</div>" +
      "<div class='score' id='teamLabel2' >Team 2</div>" +
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
      "<!--- Buttons --->" +
      "<div class='btnHolder'>" +
      "<div class=''><span>Wrong Answers</span>" +
      "<div class='buttonWrapper'>" +
      "<div id='wrongTeam' class='button left'><img style='width: 40px; height: 40px; filter: brightness(0) invert(1);' src='" +
      domain +
      "images/cross.png'></div>" +
      "<div id='revertWrong' class='button right'><img style='width: 40px; height: 40px; filter: brightness(0) invert(1);' src='" +
      domain +
      "images/reverse.png'></div>" +
      "</div></div>" +
      "<div class=''><span>Theme Music</span>" +
      "<div class='buttonWrapper'>" +
      "<div id='playTheme' class='button'><img style='width: 40px; height: 40px; filter: brightness(0) invert(1);' src='" +
      domain +
      "images/play.png'></div>" +
      "<div id='stopTheme' class='button'><img style='width: 40px; height: 40px; filter: brightness(0) invert(1);' src='" +
      domain +
      "images/stop.png'></div>" +
      "</div></div>" +
      "<div class=''><span>Round Actions</span>" +
      "<div class='buttonWrapper'>" +
      "<div id='awardTeam1' data-team='1' class='button'>Team 1</div>" +
      "<div id='newQuestion' class='button'>Next Round</div>" +
      "<div id='awardTeam2' data-team='2' class='button'>Team 2</div>" +
      "</div></div>" +
      "<div class=''><span>Game Actions</span>" +
      "<div class='buttonWrapper'>" +
      "<div id='toggleLock' class='button'>Lock Player</div>" +
      "<div id='resetGame' class='button'>Reset Game</div>" +
      "</div></div>" +
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
  saveState: function (roundScoreOverride, scoreOverride) {
    var state = {
      currentQ: app.currentQ,
      team1: scoreOverride
        ? scoreOverride.team1
        : app.pendingScores
          ? app.pendingScores.team1
          : parseInt(app.board.find("#team1").html()) || 0,
      team2: scoreOverride
        ? scoreOverride.team2
        : app.pendingScores
          ? app.pendingScores.team2
          : parseInt(app.board.find("#team2").html()) || 0,
      wrong: parseInt(app.board.find("#wrongScore").html()) || 0,
      team1Name: app.board.find("#teamLabel1").text(),
      team2Name: app.board.find("#teamLabel2").text(),
      revealedCards: [],
      awardedCards: app.awardedCards.slice(),
      roundScore: typeof roundScoreOverride === "number" ? roundScoreOverride : 0,
      questionVisible: !app.board.find(".questionHide").is(":visible"),
    };
    app.board.find(".card").each(function (index) {
      if ($(this).data("flipped")) {
        state.revealedCards.push(index);
        if (
          typeof roundScoreOverride !== "number" &&
          app.awardedCards.indexOf(index) === -1
        ) {
          state.roundScore += parseInt($(this).find("b").text(), 10) || 0;
        }
      }
    });
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
        var parsed = JSON.parse(customData);
        if (!validateQuestionsData(parsed)) {
          app.jsonLoaded(parsed);
          return;
        }
        console.warn("Saved custom questions failed validation; using defaults.");
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
      console.error(
        "questionsData is not defined. Make sure questions.js is loaded before master.js.",
      );
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
    app.currentQ = 0;
    if (
      saved &&
      typeof saved.currentQ === "number" &&
      app.allData[saved.currentQ]
    ) {
      app.currentQ = saved.currentQ;
    }
    app.makeQuestion(app.currentQ);
    $("body").append(app.board);
    app.board.append($("#wrongImagePerTeam"));
    if (saved) {
      var savedWrong = Math.max(0, Math.min(3, Number(saved.wrong) || 0));
      app.board.find("#team1").text(Number(saved.team1) || 0);
      app.board.find("#team2").text(Number(saved.team2) || 0);
      app.board.find("#wrongScore").text(savedWrong);
      if (savedWrong > 0) {
        renderWrongMarks(savedWrong);
      }
      if (saved.team1Name) {
        app.applyTeamName("1", saved.team1Name);
      }
      if (saved.team2Name) {
        app.applyTeamName("2", saved.team2Name);
      }
      app.applySavedRoundState(saved);
    }
  },
  applySavedRoundState: function (saved) {
    if (!saved) return;
    var cards = app.board.find(".card");
    app.awardedCards = Array.isArray(saved.awardedCards) ? saved.awardedCards : [];
    cards.each(function (index) {
      var flipped =
        Array.isArray(saved.revealedCards) &&
        saved.revealedCards.indexOf(index) !== -1;
      $(this).data("flipped", flipped).toggleClass("flipped", flipped);
    });
    app.board.find("#boardScore").text(Math.max(0, Number(saved.roundScore) || 0));
    app.board.find(".questionHide").toggle(!saved.questionVisible);
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
    app.awardedCards = [];
    question.text(qText.replace(/&x22;/gi, '"'));
    col1.empty();
    col2.empty();

    for (var i = 0; i < qNum; i++) {
      if (window.CP.shouldStopExecution(1)) break;
      var aLI;
      if (qAnswr[i]) {
        aLI = buildAnswerCard(
          { answer: qAnswr[i][0], points: qAnswr[i][1] },
          i,
          true,
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
      if (app.awardInProgress) return;
      var card = $(".card", this);
      if (!card.length || !card.find(".back span").text().trim()) return;
      var flipped = card.data("flipped");
      card.toggleClass("flipped");
      flipped = !flipped;
      card.data("flipped", flipped);
      app.getBoardScore();
      correct.play();
      app.saveState();
    }

    cardHolders.on("click", showCard);

    var roundLabel =
      q === app.allData.length - 1 ? "Last Round" : "Round #" + (q + 1);
    app.board.find(".questionNumber").html(roundLabel);
    app.board
      .find("#newQuestion")
      .toggleClass("disabled", q >= app.allData.length - 1);
    requestAnimationFrame(fitMasterBoard);
  },
  getBoardScore: function () {
    var boardScore = app.board.find("#boardScore");
    var currentVal = parseInt(boardScore.html()) || 0;
    var score = app.calculateBoardScore();
    animateValue(currentVal, score, 1000, function (v) {
      boardScore.html(Math.round(v));
    });
  },
  calculateBoardScore: function () {
    var score = 0;
    app.board.find(".card").each(function (index) {
      if ($(this).data("flipped") && app.awardedCards.indexOf(index) === -1) {
        score += parseInt($(this).find("b").text(), 10) || 0;
      }
    });
    return score;
  },
  awardPoints: function () {
    if (app.awardInProgress) return;
    if (theme.paused) {
      theme.play();
    }
    var num = $(this).attr("data-team");
    var boardScore = app.board.find("#boardScore");
    var currentScore = app.calculateBoardScore();
    if (currentScore <= 0) return;
    boardScore.text(currentScore);
    app.awardInProgress = true;
    var team = app.board.find("#team" + num);
    var teamScoreStart = parseInt(team.html()) || 0;
    var teamScoreUpdated = teamScoreStart + currentScore;
    app.board.find(".card").each(function (index) {
      if ($(this).data("flipped") && app.awardedCards.indexOf(index) === -1) {
        app.awardedCards.push(index);
      }
    });
    app.pendingScores = {
      team1:
        num === "1"
          ? teamScoreUpdated
          : parseInt(app.board.find("#team1").text(), 10) || 0,
      team2:
        num === "2"
          ? teamScoreUpdated
          : parseInt(app.board.find("#team2").text(), 10) || 0,
    };
    boardScore.text(0);
    app.saveState(0, app.pendingScores);

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
        app.saveState(0);
        app.pendingScores = null;
        app.awardInProgress = false;
      },
    );

    animateValue(currentScore, 0, 1000, function (v) {
      boardScore.html(Math.round(v));
    });
    //$("#newQuestion").click();
  },
  changeQuestion: function () {
    if (app.awardInProgress || app.currentQ >= app.allData.length - 1) return;
    app.currentQ++;
    app.makeQuestion(app.currentQ);
    app.saveState();
  },
  addWrong: function () {
    wrong.play();

    var scoreEl = app.board.find("#wrongScore");
    var wrongScore = { var: parseInt(scoreEl.html()) };
    if (wrongScore.var >= 3) return;
    scoreEl.html(wrongScore.var + 1);
    $("#wrongImage").show().delay(1000).fadeOut(500);
    if (wrongScore.var < 3) {
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
    app.saveState();
  },
  hideQuestion: function () {
    app.board.find(".questionHide").show();
  },
  playTheme: function () {
    theme.play();
  },
  applyTeamName: function (num, name) {
    app.board.find("#teamLabel" + num).text(name);
    app.board.find("#awardTeam" + num).text(name);
  },
  renameTeam: function (num) {
    var current = app.board.find("#teamLabel" + num).text();
    var newName = prompt("Enter a new name for Team " + num, current);
    if (newName === null) return;
    newName = newName.trim();
    if (newName === "") return;
    renameTeam(num, newName);
  },
  stopTheme: function () {
    theme.pause();
    theme.currentTime = 0;
  },
  resetGame: function () {
    if (app.awardInProgress) return;
    if (
      !confirm(
        "Reset the game? This clears both team scores and returns to Round #1.",
      )
    ) {
      return;
    }
    app.currentQ = 0;
    app.board.find("#team1").html(0);
    app.board.find("#team2").html(0);
    resetWrong();
    app.makeQuestion(app.currentQ);
    app.saveState();
  },
  updateLockButtonLabel: function () {
    var isLocked = localStorage.getItem("feudLockScreen") === "true";
    app.board
      .find("#toggleLock")
      .text(isLocked ? "Unlock Player" : "Lock Player");
  },
  toggleLockScreen: function () {
    var isLocked = localStorage.getItem("feudLockScreen") === "true";
    localStorage.setItem("feudLockScreen", isLocked ? "false" : "true");
    app.updateLockButtonLabel();
  },
  // Initial function
  init: function () {
    app.loadQuestions();
    app.board.find("#newQuestion").on("click", app.changeQuestion);
    app.board.find("#awardTeam1").on("click", app.awardPoints);
    app.board.find("#awardTeam2").on("click", app.awardPoints);
    app.board.find("#wrongTeam").on("click", app.addWrong);
    app.board.find("#revertWrong").on("click", app.revertWrong);
    app.board.find("#playTheme").on("click", app.playTheme);
    app.board.find("#stopTheme").on("click", app.stopTheme);
    app.board.find("#resetGame").on("click", app.resetGame);
    app.board.find("#toggleLock").on("click", app.toggleLockScreen);
    app.updateLockButtonLabel();
    app.board.find("#teamLabel1").on("click", function () {
      app.renameTeam("1");
    });
    app.board.find("#teamLabel2").on("click", function () {
      app.renameTeam("2");
    });
    app.board.find(".questionHolder").on("click", app.showQuestion);
  },
};

app.init();

function fitMasterBoard() {
  var board = app.board && app.board[0];
  var page = document.querySelector(".masterPage");
  if (!board || !board.isConnected || !page) return;

  var width = board.offsetWidth;
  var height = board.offsetHeight;
  if (!width || !height) return;

  var availableWidth = Math.max(1, page.clientWidth - 12);
  var availableHeight = Math.max(1, page.clientHeight - 12);
  var scale = Math.min(availableWidth / width, availableHeight / height);
  board.style.setProperty("--fit-scale", String(scale));
}

requestAnimationFrame(fitMasterBoard);
window.addEventListener("resize", fitMasterBoard);

window.addEventListener("storage", function (event) {
  if (event.key !== "feudQuestionsData") return;
  var data = questionsData;
  if (event.newValue) {
    try {
      var imported = JSON.parse(event.newValue);
      if (!validateQuestionsData(imported)) data = imported;
    } catch (e) {
      console.warn("Could not load imported question data:", e);
    }
  }
  app.allData = data.rounds;
  app.questions = app.allData.map(function (round) {
    return round.question;
  });
  app.currentQ = 0;
  app.board.find("#team1, #team2").text(0);
  app.applyTeamName("1", "Team 1");
  app.applyTeamName("2", "Team 2");
  resetWrong();
  app.makeQuestion(0);
  app.saveState();
});

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
      $("#wrongImage").show().delay(1000).fadeOut(500);
    }
    renderWrongMarks(points);
  }
  console.log("Adjusted wrong count to " + points);
  app.saveState();
}

function addWrong() {
  wrong.play();
  var scoreEl = app.board.find("#wrongScore");
  var wrongScore = { var: parseInt(scoreEl.html()) };
  adjustWrong(wrongScore.var + 1);
}

function renameTeam(teamNum, name) {
  app.applyTeamName(teamNum, name);
  console.log("Renamed team " + teamNum + " to " + name);
  app.saveState();
}
