const fs = require("fs").promises
const path = require("path")

module.exports = {
  name: "feedback",
  description: "Provide feedback or report issues",
  async execute(bot, msg, args, db) {
    const chatId = msg.chat.id
    const userId = msg.from.id
    const username = msg.from.username || "Unknown"

    if (args.length === 0) {
      return bot.sendMessage(
        chatId,
        "Please provide your feedback or report after the command. For example: /feedback Your message here",
      )
    }

    const feedback = args.join(" ")
    const timestamp = new Date().toISOString()
    const feedbackEntry = `[${timestamp}] User: ${username} (ID: ${userId})\nFeedback: ${feedback}\n\n`

    try {
      const feedbackDir = path.join(__dirname, "..", "feedback")
      await fs.mkdir(feedbackDir, { recursive: true })

      const feedbackFile = path.join(feedbackDir, "feedback.txt")
      await fs.appendFile(feedbackFile, feedbackEntry)

      const ownerId = process.env.OWNER_ID
      if (ownerId) {
        await bot.sendMessage(ownerId, `New feedback received:\n\n${feedbackEntry}`)
      }

      await bot.sendMessage(
        chatId,
        "Thank you for your feedback! It has been recorded and will be reviewed by our team.",
      )
    } catch (error) {
      console.error("Error saving feedback:", error)
      await bot.sendMessage(chatId, "Sorry, there was an error saving your feedback. Please try again later.")
    }
  },
}

