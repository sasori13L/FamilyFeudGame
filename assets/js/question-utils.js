/* Shared question validation and answer-card construction. */
(function (global) {
  "use strict";

  function validateQuestionsData(data) {
    if (!data || !Array.isArray(data.rounds) || data.rounds.length === 0) {
      return "Expected an object with a non-empty rounds array.";
    }

    for (var i = 0; i < data.rounds.length; i++) {
      var round = data.rounds[i];
      if (
        !round ||
        typeof round.question !== "string" ||
        !round.question.trim()
      ) {
        return "Round " + (i + 1) + " needs a non-empty question.";
      }
      if (!Array.isArray(round.answers) || round.answers.length === 0 || round.answers.length > 8) {
        return "Round " + (i + 1) + " needs between 1 and 8 answers.";
      }
      for (var j = 0; j < round.answers.length; j++) {
        var answer = round.answers[j];
        if (
          !answer ||
          typeof answer.answer !== "string" ||
          !answer.answer.trim() ||
          !Number.isFinite(Number(answer.points)) ||
          !Number.isInteger(Number(answer.points)) ||
          Number(answer.points) < 0
        ) {
          return (
            "Answer " +
            (j + 1) +
            " in round " +
            (i + 1) +
            " needs text and a non-negative integer point value."
          );
        }
      }
    }
    return null;
  }

  function buildAnswerCard(answer, index, isMaster) {
    var holder = $("<div>", {
      "class": "cardHolder",
      id: "card_" + (index + 1),
    });
    var card = $("<div>", { "class": "card" });
    var front = $("<div>", { "class": "front" });
    if (isMaster) {
      $("<div>", { "class": "peekAnswer" })
        .text(answer.answer + " — " + answer.points)
        .appendTo(front);
    }
    $("<span>", { "class": "DBG" })
      .text(String(index + 1))
      .appendTo(front);
    var back = $("<div>", { "class": "back DBG" });
    $("<span>").text(answer.answer).appendTo(back);
    $("<b>", { "class": "LBG" }).text(String(answer.points)).appendTo(back);
    return holder.append(card.append(front, back));
  }

  global.validateQuestionsData = validateQuestionsData;
  global.buildAnswerCard = buildAnswerCard;
})(window);
