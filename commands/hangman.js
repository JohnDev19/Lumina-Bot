const crypto = require('crypto');

module.exports = {
  name: "hangman",
  description: "Comprehensive Hangman Game with Full Alphabet",
  
  async execute(bot, msg, args, db) {
    const chatId = msg.chat.id;
    
    // Expanded word list with more variety
    const words = {
      easy: ["cat", "dog", "bird", "fish", "tree", "sun", "car"],
      medium: ["python", "coding", "robot", "music", "dance", "game", "web"],
      hard: ["javascript", "algorithm", "quantum", "galaxy", "complex", "network", "system"]
    };

    // Secure random word selection
    function secureRandomWord(difficulty = 'medium') {
      const selectedWords = words[difficulty];
      const randomIndex = crypto.randomInt(0, selectedWords.length);
      return selectedWords[randomIndex].toLowerCase();
    }

    // Initialize game state
    const word = secureRandomWord();
    const guessedLetters = new Set();
    let remainingAttempts = 6;

    // Enhanced hangman display with more spacing
    function getHangmanDisplay() {
      const hangmanStages = [
        "+---+       \n" +
        "|   |       \n" +
        "            \n" +
        "            \n" +
        "            \n" +
        "            \n" +
        "=========",
        
        "+---+       \n" +
        "|   |       \n" +
        "O   |       \n" +
        "            \n" +
        "            \n" +
        "            \n" +
        "=========",
        
        "+---+       \n" +
        "|   |       \n" +
        "O   |       \n" +
        "|   |       \n" +
        "            \n" +
        "            \n" +
        "=========",
        
        "+---+       \n" +
        "|   |       \n" +
        "O   |       \n" +
        "/|  |       \n" +
        "            \n" +
        "            \n" +
        "=========",
        
        "+---+       \n" +
        "|   |       \n" +
        "O   |       \n" +
        "/|\\|       \n" +
        "            \n" +
        "            \n" +
        "=========",
        
        "+---+       \n" +
        "|   |       \n" +
        "O   |       \n" +
        "/|\\|       \n" +
        "/   |       \n" +
        "            \n" +
        "=========",
        
        "+---+       \n" +
        "|   |       \n" +
        "O   |       \n" +
        "/|\\|       \n" +
        "/ \\|       \n" +
        "            \n" +
        "=========",
      ];
      return hangmanStages[6 - remainingAttempts];
    }

    // Create full A-Z keyboard
    function createFullKeyboard() {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      return [
        alphabet.slice(0, 13).map(letter => ({
          text: guessedLetters.has(letter.toLowerCase()) ? '✓' : letter,
          callback_data: letter.toLowerCase()
        })),
        alphabet.slice(13).map(letter => ({
          text: guessedLetters.has(letter.toLowerCase()) ? '✓' : letter,
          callback_data: letter.toLowerCase()
        }))
      ];
    }

    // Word display function
    function getWordDisplay() {
      return word
        .split('')
        .map(letter => guessedLetters.has(letter) ? letter : '_')
        .join(' ');
    }

    // Game start instructions
    function getGameInstructions() {
      return "🎮 Hangman Game Instructions:\n" +
             "• Guess the hidden word letter by letter\n" +
             "• You have 6 incorrect attempts\n" +
             "• Click on letters to guess\n" +
             "• Try to save the hanging stick figure! 🕹️";
    }

    // Send initial game message
    async function startGame() {
      const gameMessage = await bot.sendMessage(chatId, 
        `${getGameInstructions()}\n\n${getHangmanDisplay()}\n\n${getWordDisplay()}`, 
        {
          reply_markup: {
            inline_keyboard: createFullKeyboard()
          }
        }
      );
      return gameMessage;
    }

    // Update game message
    async function updateGameMessage(gameMessage) {
      try {
        await bot.editMessageText(
          `Hangman Game\n\n${getHangmanDisplay()}\n\n${getWordDisplay()}\n\n` +
          `Guessed Letters: ${Array.from(guessedLetters).join(', ')}\n` +
          `Remaining Attempts: ${remainingAttempts}`,
          {
            chat_id: chatId,
            message_id: gameMessage.message_id,
            reply_markup: {
              inline_keyboard: createFullKeyboard()
            }
          }
        );
      } catch (error) {
        console.error("Message update error:", error);
      }
    }

    // Game logic handler
    async function handleGuess(query, gameMessage) {
      const letter = query.data.toLowerCase();

      // Prevent duplicate guesses
      if (guessedLetters.has(letter)) {
        await bot.answerCallbackQuery(query.id, {
          text: "You've already guessed this letter!",
          show_alert: true
        });
        return true;
      }

      guessedLetters.add(letter);

      if (!word.includes(letter)) {
        remainingAttempts--;
        await bot.answerCallbackQuery(query.id, {
          text: `Incorrect! "${letter.toUpperCase()}" is not in the word.`,
          show_alert: true
        });
      } else {
        await bot.answerCallbackQuery(query.id, {
          text: `Good guess! "${letter.toUpperCase()}" is in the word.`,
          show_alert: true
        });
      }

      await updateGameMessage(gameMessage);

      // Check game end conditions
      if (remainingAttempts === 0) {
        await bot.sendMessage(chatId, `❌ Game Over! The word was: ${word.toUpperCase()}`);
        return false;
      }

      if (!getWordDisplay().includes('_')) {
        await bot.sendMessage(chatId, `🎉 Congratulations! You guessed the word: ${word.toUpperCase()}`);
        return false;
      }

      return true;
    }

    // Main game execution
    const gameMessage = await startGame();

    // Event listener for letter guesses
    bot.on('callback_query', async (query) => {
      if (query.message.message_id !== gameMessage.message_id) return;
      
      const continueGame = await handleGuess(query, gameMessage);
      if (!continueGame) {
        bot.removeListener('callback_query', this);
      }
    });
  }
};
