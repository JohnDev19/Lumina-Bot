module.exports = {
  name: 'notification',
  description: 'Toggle group join notifications',
  async execute(bot, msg, args) {
    const ownerId = process.env.OWNER_ID;

    if (msg.from.id.toString() !== ownerId) {
      return bot.sendMessage(msg.chat.id, '❌ This command is restricted to the bot owner.');
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['on', 'off', 'status'].includes(action)) {
      return bot.sendMessage(msg.chat.id, `
🔔 Notification Management

Usage: 
• /notification on - Enable group join notifications
• /notification off - Disable group join notifications
• /notification status - Check current notification status

Current status: ${process.env.GROUP_JOIN_NOTIFICATIONS || 'on'}
      `);
    }

    try {
      if (action === 'status') {
        const currentStatus = process.env.GROUP_JOIN_NOTIFICATIONS || 'on';
        return bot.sendMessage(msg.chat.id, `
🔔 Current Notification Status:
• Group Join Notifications: ${currentStatus.toUpperCase()}
        `);
      }

      process.env.GROUP_JOIN_NOTIFICATIONS = action;

      const statusMessage = action === 'on' 
        ? '🔔 Group join notifications are now ENABLED.' 
        : '🔇 Group join notifications are now DISABLED.';

      await bot.sendMessage(msg.chat.id, statusMessage);

    } catch (error) {
      console.error('Notification Toggle Error:', error);
      await bot.sendMessage(msg.chat.id, '❌ Failed to update notification settings.');
    }
  },

  async notifyOwnerOnGroupJoin(bot, msg) {
    const ownerId = process.env.OWNER_ID;
    
    if (process.env.GROUP_JOIN_NOTIFICATIONS === 'off') return;

    try {
      const newMembers = msg.new_chat_members;
      const botUsername = bot.botInfo.username;

      const botMember = newMembers.find(member => 
        member.username === botUsername
      );

      if (botMember) {
        const chatId = msg.chat.id;
        const chatTitle = msg.chat.title || 'Unknown Group';
        const chatType = msg.chat.type;

        const notificationMessage = `
🤖 <b>Bot Added to New Group</b>

📌 Group Details:
• Name: <code>${chatTitle}</code>
• Type: <code>${chatType}</code>
• Group ID: <code>${chatId}</code>

🕒 Added at: ${new Date().toLocaleString()}
        `;

        await bot.sendMessage(ownerId, notificationMessage, {
          parse_mode: 'HTML'
        });
      }
    } catch (error) {
      console.error('Group Join Notification Error:', error);
    }
  }
};
