class BoggleGame {
  /* make a new game at this DOM id */

  constructor(boardId, secs = 60) {
    this.originalSecs = secs; // store the original game length
    this.secs = secs; // game length
    this.boardId = boardId;
    this.score = 0;
    this.words = new Set();
    this.board = $("#" + boardId);

    // every 1000 msec, "tick"
    this.timer = setInterval(this.tick.bind(this), 1000);

    $(".add-word", this.board).on("submit", this.handleSubmit.bind(this));

    // Attach the new game button click handler
    $("#new-game-btn").on("click", this.startNewGame.bind(this));
  }

  /* show word in list of words */

  showWord(word) {
    $(".words", this.board).append($("<li>", { text: word }));
  }

  /* show score in html */

  showScore() {
    $(".score", this.board).text(this.score);
  }

  /* show a status message */

  showMessage(msg, cls) {
    $(".msg", this.board)
      .text(msg)
      .removeClass()
      .addClass(`msg ${cls}`);
  }

  /* handle submission of word: if unique and valid, score & show */

  async handleSubmit(evt) {
    evt.preventDefault();
    const $word = $(".word", this.board);

    let word = $word.val();
    if (!word) return;

    if (this.words.has(word)) {
      this.showMessage(`Already found ${word}`, "err");
      return;
    }

    // check server for validity
    const resp = await axios.get("/check-word", { params: { word: word }});
    if (resp.data.result === "not-word") {
      this.showMessage(`${word} is not a valid English word`, "err");
    } else if (resp.data.result === "not-on-board") {
      this.showMessage(`${word} is not a valid word on this board`, "err");
    } else {
      this.showWord(word);
      this.score += word.length;
      this.showScore();
      this.words.add(word);
      this.showMessage(`Added: ${word}`, "ok");
    }

    $word.val("").focus();
  }

  /* Update timer in DOM */

  showTimer() {
    $(".timer", this.board).text(this.secs);
  }

  /* Tick: handle a second passing in game */

  async tick() {
    this.secs -= 1;
    this.showTimer();

    if (this.secs === 0) {
      clearInterval(this.timer);
      await this.scoreGame();
    }
  }

  /* end of game: score and update message. */

  async scoreGame() {
    $(".add-word", this.board).hide();
    const resp = await axios.post("/post-score", { score: this.score });
    if (resp.data.brokeRecord) {
      this.showMessage(`New record: ${this.score}`, "ok");
    } else {
      this.showMessage(`Final score: ${this.score}`, "ok");
    }
  }

  /* Reset the game state for a new game */

  async startNewGame() {
    clearInterval(this.timer); // Stop the current timer
    this.score = 0;
    this.words = new Set();
    this.secs = this.originalSecs; // Reset to the original game length
    this.showScore();
    this.showTimer();

    // Clear the list of words
    $(".words").empty();

    // Request a new board and stats from the server
    const resp = await axios.get("/new-game");
    const newBoard = resp.data.board;
    const newHighscore = resp.data.highscore;
    const newNplays = resp.data.nplays;

    // Update the board in the UI
    const boardTable = $(".board tbody");
    boardTable.empty(); // Clear the old board
    newBoard.forEach(row => {
      const rowHtml = row.map(cell => `<td>${cell}</td>`).join('');
      boardTable.append(`<tr>${rowHtml}</tr>`);
    });

    // Update high score and number of plays
    $(".highscore").text(newHighscore);
    $(".nplays").text(newNplays);

    $(".add-word", this.board).show(); // Show the word input form
    this.timer = setInterval(this.tick.bind(this), 1000); // Restart the timer
  }
}
