module.exports = {
  name: 'groupurl',
  description: 'Generate an invite link for a specified group',
  
  async execute(bot, msg, args, db) {
    try {
      const botOwnerId = process.env.OWNER_ID ? parseInt(process.env.OWNER_ID) : null;
      
      if (!botOwnerId || msg.from.id !== botOwnerId) {
        return bot.sendMessage(msg.chat.id, '❌ This command is restricted to the bot owner.');
      }

      if (args.length === 0) {
        return bot.sendMessage(msg.chat.id, '❌ Please provide a group ID. Usage: /groupurl <group_id>');
      }

      const targetGroupId = args[0];

      try {
        const inviteLink = await generateGroupInviteLink(bot, targetGroupId);

        await bot.sendMessage(botOwnerId, `
🔗 <b>Group Invite Link Generated</b>

📍 Group ID: <code>${targetGroupId}</code>
🌐 Invite Link: ${inviteLink}

<i>Link is valid for 7 days or until revoked</i>
        `, {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });

        await bot.sendMessage(msg.chat.id, '✅ Invite link generated and sent to your private chat.');

      } catch (linkError) {
        console.error('Invite Link Generation Error:', linkError);

        let errorMessage = '❌ Could not generate invite link.';
        
        if (linkError.message.includes('bot is not a member')) {
          errorMessage = '❌ I am not a member of the specified group.';
        } else if (linkError.message.includes('not enough rights')) {
          errorMessage = '❌ I do not have admin rights to generate an invite link in that group.';
        }

        await bot.sendMessage(msg.chat.id, errorMessage);
      }

    } catch (error) {
      console.error('Group URL Command Error:', error);
      await bot.sendMessage(msg.chat.id, '❌ An unexpected error occurred.');
    }
  }
};

async function generateGroupInviteLink(bot, chatId) {
  try {
    const existingLink = await bot.exportChatInviteLink(chatId);
    if (existingLink) return existingLink;

    const newLink = await bot.createChatInviteLink(chatId, {
      expire_date: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
      member_limit: 0
    });

    return newLink.invite_link;
  } catch (error) {
    if (chatId.toString().startsWith('-100')) {
      return `https://t.me/+${chatId.toString().replace('-100', '')}`;
    }
    throw error;
  }
}
