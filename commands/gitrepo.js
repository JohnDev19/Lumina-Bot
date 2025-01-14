const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'gitrepo',
    description: 'Search and download GitHub repositories',
    async execute(bot, msg, args) {
        if (args.length < 1) {
            return bot.sendMessage(msg.chat.id, '❌ Usage:\n/gitrepo <search term>\n/gitrepo <username>/<repository>');
        }

        const input = args.join(' ');
        const chatId = msg.chat.id;

        try {
            await bot.sendChatAction(chatId, 'typing');

            let repository;
            
            // Check if input contains a slash (specific repository)
            if (input.includes('/')) {
                const [username, repoName] = input.split('/');
                
                if (!repoName) {
                    return bot.sendMessage(chatId, '❌ Please use format: username/repository');
                }

                try {
                    repository = await getSpecificRepository(username, repoName);
                } catch (error) {
                    return bot.sendMessage(chatId, '❌ Repository not found. Check username and repository name.');
                }
            } else {
                // Search for repositories
                const repositories = await searchRepositories(input);
                
                if (repositories.length === 0) {
                    return bot.sendMessage(chatId, '🔍 No repositories found. Please try different keywords.');
                }
                
                // Take the first (most relevant) result
                repository = repositories[0];
            }

            // Download repository
            await bot.sendChatAction(chatId, 'upload_document');
            const zipFilePath = await downloadRepository(repository.full_name);
            
            // Prepare repository details
            const caption = formatRepoMessage(repository);

            // Send document with caption
            await bot.sendDocument(chatId, zipFilePath, {
                caption: caption
            });

            // Clean up temporary zip file
            fs.unlinkSync(zipFilePath);

        } catch (error) {
            console.error('GitHub Repository Error:', error);
            handleError(bot, chatId, error);
        }
    }
};

async function searchRepositories(query) {
    try {
        const response = await axios.get('https://api.github.com/search/repositories', {
            params: {
                q: query,
                sort: 'stars',
                order: 'desc',
                per_page: 1 // Only get the top result
            },
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'GitHub-Repository-Bot'
            }
        });

        return response.data.items;
    } catch (error) {
        console.error('Repository Search Error:', error);
        throw error;
    }
}

function formatRepoMessage(repo) {
    const created = new Date(repo.created_at).toLocaleDateString();
    const updated = new Date(repo.updated_at).toLocaleDateString();
    
    return `📚 Repository Details
Name: ${repo.full_name}
Description: ${repo.description || 'No description'}
⭐ Stars: ${repo.stargazers_count.toLocaleString()}
👁 Watchers: ${repo.watchers_count.toLocaleString()}
🔄 Forks: ${repo.forks_count.toLocaleString()}
💻 Language: ${repo.language || 'Not specified'}
📅 Created: ${created}
🔄 Last Updated: ${updated}
🔍 Open Issues: ${repo.open_issues_count}
📋 License: ${repo.license ? repo.license.name : 'Not specified'}
🔗 GitHub: ${repo.html_url}`.trim();
}

async function getSpecificRepository(username, repository) {
    const response = await axios.get(`https://api.github.com/repos/${username}/${repository}`, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Repository-Bot'
        }
    });

    return response.data;
}

async function downloadRepository(fullName) {
    const response = await axios({
        method: 'get',
        url: `https://api.github.com/repos/${fullName}/zipball`,
        responseType: 'arraybuffer',
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Repository-Bot'
        }
    });

    const fileName = `${fullName.replace('/', '_')}.zip`;
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, response.data);
    return filePath;
}

function handleError(bot, chatId, error) {
    let errorMessage = '❌ An unexpected error occurred.';
    
    if (error.response) {
        switch (error.response.status) {
            case 404:
                errorMessage = '❌ Repository not found.';
                break;
            case 403:
                errorMessage = '❌ Rate limit exceeded. Try again later.';
                break;
            default:
                errorMessage = `❌ Server error (${error.response.status}).`;
        }
    } else if (error.request) {
        errorMessage = '❌ Network error. Please check your connection.';
    }

    bot.sendMessage(chatId, errorMessage);
}
