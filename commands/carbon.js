const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  name: 'carbon',
  description: 'Generate beautiful code screenshots',
  async execute(bot, msg, args) {
    try {
      if (args.length === 0) {
        return bot.sendMessage(msg.chat.id, `
❌ <b>Invalid Carbon Usage!</b>

• Provide code to generate a beautiful screenshot
• Supported Languages: JavaScript, Python, Java, C++, Ruby, Swift, Kotlin, TypeScript, Go, Rust

<b>Usage Examples:</b>
• /carbon console.log('Hello World!')
• /carbon def greet():
    print("Hello, World!")

<b>Optional Themes:</b>
• Add theme after code: /carbon [theme] [code]
• Available Themes: dracula, monokai, night-owl, solarized
        `, { parse_mode: 'HTML' });
      }

      let theme = 'dracula';
      let code = args.join(' ');

      const themeOptions = ['dracula', 'monokai', 'night-owl', 'solarized'];
      if (themeOptions.includes(args[0])) {
        theme = args[0];
        code = args.slice(1).join(' ');
      }

      if (!code.trim()) {
        return bot.sendMessage(msg.chat.id, '❌ Please provide valid code to generate screenshot.', { parse_mode: 'HTML' });
      }

      // Limit code length to prevent API errors
      if (code.length > 1000) {
        return bot.sendMessage(msg.chat.id, '❌ Code is too long. Maximum 1000 characters allowed.', { parse_mode: 'HTML' });
      }

      // Multiple API endpoints for redundancy
      const carbonAPIs = [
        'https://carbonara.solopov.dev/api/cook',
        'https://carbon-api.vercel.app/api/carbon',
        'https://carbon-api.herokuapp.com/generate'
      ];

      let imageData = null;
      let usedAPI = null;

      for (const apiUrl of carbonAPIs) {
        try {
          const formData = new FormData();
          formData.append('code', code);
          formData.append('theme', theme);
          formData.append('background', 'rgba(171, 184, 195, 1)');
          formData.append('language', 'auto');

          const response = await axios.post(apiUrl, formData, {
            headers: {
              ...formData.getHeaders(),
            },
            responseType: 'arraybuffer',
            timeout: 10000 // 10 seconds timeout
          });

          if (response.data && response.data.byteLength > 0) {
            imageData = response.data;
            usedAPI = apiUrl;
            break;
          }
        } catch (apiError) {
          console.error(`Error with API ${apiUrl}:`, apiError.message);
          continue;
        }
      }

      if (!imageData) {
        return bot.sendMessage(msg.chat.id, `
❌ <b>Carbon Screenshot Generation Failed</b>

• Unable to generate screenshot
• Please check your code syntax
• Try a shorter code snippet
• APIs might be temporarily unavailable
        `, { parse_mode: 'HTML' });
      }

      // Send the generated image
      await bot.sendPhoto(msg.chat.id, imageData, {
        caption: `🖼️ Carbon Screenshot (${theme} theme)\nGenerated via: ${usedAPI}`,
        parse_mode: 'HTML'
      });

    } catch (error) {
      console.error('Carbon Generation Error:', error);
      
      let errorMessage = '❌ Unexpected error generating code screenshot.';
      
      if (error.response) {
        errorMessage += `\n\n<b>Error Details:</b>
• Status: ${error.response.status}
• Message: ${error.response.statusText}`;
      }

      bot.sendMessage(msg.chat.id, errorMessage, { parse_mode: 'HTML' });
    }
  }
};
