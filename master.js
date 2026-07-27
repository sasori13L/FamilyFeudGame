var app = {
  version: 1,
  currentQ: 0,
  jsonFile: "Questions.json",
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
      "<div id='wrongTeam' class='button left'><img style='width: 40px; height: 40px; filter: brightness(0) invert(1);' src='images/cross.png'></div>" +
      "<div id='revertWrong' class='button right'><img style='width: 40px; height: 40px; filter: brightness(0) invert(1);' src='images/reverse.png'></div>" +
      "</div></div>" +
      "<div class=''><span>Theme Music</span>" +
      "<div class='buttonWrapper'>" +
      "<div id='playTheme' class='button'><img style='width: 40px; height: 40px; filter: brightness(0) invert(1);' src='images/play.png'></div>" +
      "<div id='stopTheme' class='button'><img style='width: 40px; height: 40px; filter: brightness(0) invert(1);' src='images/stop.png'></div>" +
      "</div></div>" +
      "<div class=''><span>Round Actions</span>" +
      "<div class='buttonWrapper'>" +
      "<div id='awardTeam1' data-team='1' class='button'>Team 1</div>" +
      "<div id='newQuestion' class='button'>Next Round</div>" +
      "<div id='awardTeam2' data-team='2' class='button'>Team 2</div>" +
      "</div></div>" +
      "<div class=''><span>Game Actions</span>" +
      "<div class='buttonWrapper'>" +
      "<div id='resetGame' class='button'>Reset Game</div>" +
      "<div id='importQuestions' class='button'>Import JSON</div>" +
      "<div id='resetQuestions' class='button'>Default Questions</div>" +
      "</div></div>" +
      "<div class=''><span>Game Settings</span>" +
      "<div class='buttonWrapper'>" +
      "<div id='toggleLock' class='button'>Lock Player</div>" +
      "</div></div>" +
      "<input type='file' id='importQuestionsInput' accept='application/json,.json' style='display:none;'>" +
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
            "<div class='peekAnswer'>" +
            qAnswr[i][0] +
            " \u2014 " +
            qAnswr[i][1] +
            "</div>" +
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
      correct.play();
      localStorage.setItem("showCard", [
        this.id,
        Math.floor(Math.random() * 100),
      ]);
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
      theme.play();
    }
    var num = $(this).attr("data-team");
    var boardScore = app.board.find("#boardScore");
    var currentScore = parseInt(boardScore.html()) || 0;
    var team = app.board.find("#team" + num);
    var teamScoreStart = parseInt(team.html()) || 0;
    var teamScoreUpdated = teamScoreStart + currentScore;
    localStorage.setItem("awardPoints", [num, Math.floor(Math.random() * 100)]);

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
    localStorage.setItem("changeQuestion", [
      app.currentQ,
      Math.floor(Math.random() * 100),
    ]);
    app.saveState();
  },
  addWrong: function () {
    wrong.play();

    var scoreEl = app.board.find("#wrongScore");
    var wrongScore = { var: parseInt(scoreEl.html()) };
    localStorage.setItem("addWrong", [Math.floor(Math.random() * 100)]);
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
      localStorage.setItem("revertWrong", [Math.floor(Math.random() * 100)]);
      app.saveState();
    }
  },
  showQuestion: function () {
    if (app.board.find(".questionHide").is(":visible")) {
      app.board.find(".questionHide").hide();
      localStorage.setItem("showQuestion", Math.floor(Math.random() * 100));
    } else {
      app.board.find(".questionHide").show();
      localStorage.setItem("showQuestion", Math.floor(Math.random() * 100));
    }
  },
  hideQuestion: function () {
    app.board.find(".questionHide").show();
    localStorage.setItem("hideQuestion", Math.floor(Math.random() * 100));
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
    localStorage.setItem("resetGame", Math.floor(Math.random() * 100));
  },
  importQuestions: function () {
    app.board.find("#importQuestionsInput").trigger("click");
  },
  handleQuestionsFile: function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var parsed;
      try {
        parsed = JSON.parse(e.target.result);
      } catch (err) {
        alert("That file is not valid JSON.");
        return;
      }
      if (
        !parsed ||
        !Array.isArray(parsed.rounds) ||
        parsed.rounds.length === 0
      ) {
        alert(
          'That JSON doesn\'t look right \u2014 expected an object with a non-empty "rounds" array, like Questions.json.',
        );
        return;
      }
      localStorage.setItem("feudQuestionsData", JSON.stringify(parsed));
      app.currentQ = 0;
      app.allData = parsed.rounds;
      app.questions = app.allData.map(function (r) {
        return r.question;
      });
      app.board.find("#team1").html(0);
      app.board.find("#team2").html(0);
      resetWrong();
      app.makeQuestion(app.currentQ);
      app.saveState();
      localStorage.setItem(
        "questionsImported",
        Math.floor(Math.random() * 100),
      );
      alert(
        "Imported " +
          app.allData.length +
          " round(s). Both scores were reset to start the new set.",
      );
    };
    reader.onerror = function () {
      alert("Could not read that file.");
    };
    reader.readAsText(file);
    event.target.value = "";
  },
  resetQuestions: function () {
    if (!localStorage.getItem("feudQuestionsData")) {
      alert("You're already using the default Questions.json.");
      return;
    }
    if (
      !confirm(
        "Switch back to the default Questions.json? This clears your imported question set.",
      )
    ) {
      return;
    }
    localStorage.removeItem("feudQuestionsData");
    app.currentQ = 0;
    function applyDefault(data) {
      app.allData = data.rounds;
      app.questions = app.allData.map(function (r) {
        return r.question;
      });
      app.board.find("#team1").html(0);
      app.board.find("#team2").html(0);
      resetWrong();
      app.makeQuestion(app.currentQ);
      app.saveState();
      localStorage.setItem(
        "questionsImported",
        Math.floor(Math.random() * 100),
      );
    }
    if (typeof questionsData !== "undefined") {
      applyDefault(questionsData);
    } else {
      $.getJSON(app.jsonFile, applyDefault);
    }
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
    app.board.find("#importQuestions").on("click", app.importQuestions);
    app.board
      .find("#importQuestionsInput")
      .on("change", app.handleQuestionsFile);
    app.board.find("#resetQuestions").on("click", app.resetQuestions);
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

function adjustScore(teamNum, points) {
  var team = app.board.find("#team" + teamNum);
  team.html(Math.round(points));
  console.log("Adjusted team " + teamNum + " scores to " + points);
  localStorage.setItem("adjustScore", [
    teamNum,
    points,
    Math.floor(Math.random() * 100),
  ]);
  app.saveState();
}

function adjustQuestion(questionNum) {
  app.currentQ = questionNum - 1;
  app.makeQuestion(app.currentQ);

  console.log("Adjusted question marker to " + (app.currentQ + 1));
  localStorage.setItem("adjustQuestion", [
    questionNum,
    Math.floor(Math.random() * 100),
  ]);
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
  localStorage.setItem("adjustWrong", [
    points,
    Math.floor(Math.random() * 100),
  ]);
  app.saveState();
}

function addWrong() {
  wrong.play();
  var scoreEl = app.board.find("#wrongScore");
  var wrongScore = { var: parseInt(scoreEl.html()) };
  adjustWrong(wrongScore.var + 1);
  localStorage.setItem("addWrong", [Math.floor(Math.random() * 100)]);
}

function renameTeam(teamNum, name) {
  app.applyTeamName(teamNum, name);
  console.log("Renamed team " + teamNum + " to " + name);
  // JSON-encode so the players tab can parse teamNum/name back out correctly
  // (a plain array gets coerced to a comma-joined string by localStorage,
  // which corrupts any name containing more than one character).
  localStorage.setItem(
    "teamName",
    JSON.stringify([teamNum, name, Math.floor(Math.random() * 100)]),
  );
  app.saveState();
}
