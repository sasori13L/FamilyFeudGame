# Family Feud Game

A static, browser-based Family Feud-style game for two teams. The host uses the **Master** screen to reveal answers and control the round, while the **Player** screen displays the board for an audience. The screens synchronize through the browser's `localStorage`.

## Run locally

No build step or package installation is required. From the project root, start a local web server:

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) and choose **Master** or **Player**. Keep both pages on the same device, in the same browser, and on the same origin (for example, two tabs at `localhost:8000`). The `storage` event used for synchronization does not work between separate devices or different browsers. The pages load jQuery 3.7.1 from the jQuery CDN, so an internet connection is needed for that dependency.

To host the static site, publish the repository's root directory on a static web host. The included `vercel.json` enables clean URLs for Vercel. There is no compilation or server-side game logic.

## Play a game

1. Open **Master** on the host's screen and **Player** on the display shown to the audience.
2. On the Master screen, click the question banner to show or hide the question and click answer cards to reveal them.
3. Use **Wrong Answers** to add a strike and the reverse button to undo one. Three strikes means the opposing team can try to steal, according to the house rules.
4. Award the points currently shown in the center to either team. Click a team name on the Master screen to rename it.
5. Choose **Next Round** to continue. **Reset Game** returns to the first round and clears team scores after confirmation. **Lock Player** covers the Player screen while setting up.

The Master screen also has controls for theme audio. Use **Import Questions** and **Reset Questions** on the landing page to manage question sets. Game state and imported questions are saved in that browser's local storage.

## Custom question file

Import a UTF-8 JSON file with a non-empty `rounds` array. Each round has a question and an array of answers; answers have a label and point value. `round` and `rank` are included in the template but are not used to order the displayed board—the array order determines card order.

```json
{
  "rounds": [
    {
      "round": 1,
      "question": "Name something people bring to a picnic.",
      "answers": [
        { "rank": 1, "answer": "Food", "points": 40 },
        { "rank": 2, "answer": "A blanket", "points": 25 }
      ]
    }
  ]
}
```

The board displays up to eight answer slots and adds blank slots when a round has fewer than eight answers. Use the included [sample_question.json](sample_question.json) as a starting template. Importing a file replaces the current custom set and resets the game; **Reset Questions** removes the imported set and restores the built-in sample data.

## Project structure

```text
index.html                 Landing page and question import/reset
pages/master.html          Host controls
pages/players.html         Audience board
pages/instructions.html    System usage guide
pages/mechanics.html       Game rules overview
assets/css/styles.css      Shared board and content-page styles
assets/js/main.js          Shared audio, animation, and board helpers
assets/js/master.js        Host board, controls, persistence, and sync
assets/js/players.js       Audience board and sync handlers
assets/js/questions.js     Built-in sample questions
assets/audio/              Correct, wrong, and theme audio
assets/images/             Board backgrounds and controls
sample_question.json       Importable question template
vercel.json                Static hosting URL configuration
```

## External dependency

The Master and Player pages include jQuery 3.7.1 from `https://code.jquery.com`. All other application assets are served from this repository.
