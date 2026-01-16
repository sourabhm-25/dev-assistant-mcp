import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPManager } from './mcp-manager.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

/* ------------------ Setup ------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/* ------------------ MCP Manager ------------------ */
const mcpManager = new MCPManager();

/* ------------------ Gemini Setup ------------------ */
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY missing');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash'
});

/* ------------------ System Prompt ------------------ */
const SYSTEM_PROMPT = `You are an intelligent AI development assistant with access to GitHub, Jira, Slack, and Documentation tools.

RESPONSE FORMAT:
You must respond in ONE of these JSON formats:

1. TO USE A TOOL:
{
  "action": "tool",
  "tool": "server.toolname",
  "arguments": { "param": "value" }
}

2. TO GIVE FINAL ANSWER (after getting tool results):
{
  "action": "response",
  "message": "Your natural language answer here"
}

IMPORTANT RULES:
- When you receive TOOL_RESULT, analyze it and provide a natural, human-readable response
- Format your final answers nicely with emojis and structure
- Never show raw JSON or technical details to the user
- Never repeat the same tool call
- Use tools only when necessary
- Be concise and helpful

FORMATTING GUIDELINES:
- For lists, use numbered items with emojis
- For repository lists: 📦 Repository Name (⭐ stars, 🔤 language)
- For PRs: 🔀 #number - Title (👤 author, 📊 state)
- For issues: 🐛 #number - Title (👤 author, 🏷️ labels)
- Keep responses clean and user-friendly`;

/* ------------------ Helper: Format Tool Results ------------------ */
function formatToolResult(serverName, toolName, data) {
  try {
    // GitHub - List Repositories
    if (serverName === 'github' && toolName === 'list_repositories') {
      if (Array.isArray(data)) {
        return `Found ${data.length} repositories:\n` + data.map((repo, i) => 
          `${i + 1}. **${repo.name}**\n   ⭐ ${repo.stars || 0} stars | 🔤 ${repo.language || 'N/A'}\n   📝 ${repo.description || 'No description'}\n   🔗 ${repo.url}`
        ).join('\n\n');
      }
    }

    // GitHub - List PRs
    if (serverName === 'github' && toolName === 'list_pull_requests') {
      if (Array.isArray(data)) {
        return `Found ${data.length} pull requests:\n` + data.map((pr, i) => 
          `${i + 1}. 🔀 #${pr.number} - **${pr.title}**\n   👤 ${pr.author} | 📊 ${pr.state}\n   🔗 ${pr.url}`
        ).join('\n\n');
      }
    }

    // GitHub - Get PR Details
    if (serverName === 'github' && toolName === 'get_pull_request') {
      return `🔀 Pull Request #${data.number}\n\n` +
        `📝 **${data.title}**\n` +
        `👤 Author: ${data.author}\n` +
        `📊 State: ${data.state}\n` +
        `${data.merged ? '✅ Merged' : '⏳ Not merged'}\n` +
        `📁 Files: ${data.files_changed} | ➕ ${data.additions} | ➖ ${data.deletions}\n` +
        `💬 Commits: ${data.commits}\n` +
        `🔗 ${data.url}\n\n` +
        `**Description:**\n${data.body || 'No description'}`;
    }

    // GitHub - List Issues
    if (serverName === 'github' && toolName === 'list_issues') {
      if (Array.isArray(data)) {
        return `Found ${data.length} issues:\n` + data.map((issue, i) => 
          `${i + 1}. 🐛 #${issue.number} - **${issue.title}**\n   👤 ${issue.author} | 📊 ${issue.state}\n   🏷️ ${issue.labels.join(', ') || 'No labels'}\n   🔗 ${issue.url}`
        ).join('\n\n');
      }
    }

    // Jira - Search Issues
    if (serverName === 'jira' && toolName === 'search_issues') {
      if (data.issues && Array.isArray(data.issues)) {
        return `Found ${data.total} issues:\n` + data.issues.map((issue, i) => 
          `${i + 1}. 🎯 **${issue.key}** - ${issue.summary}\n   📊 ${issue.status} | 🔴 ${issue.priority}\n   👤 ${issue.assignee}`
        ).join('\n\n');
      }
    }

    // Slack - List Channels
    if (serverName === 'slack' && toolName === 'list_channels') {
      if (Array.isArray(data)) {
        return `Found ${data.length} channels:\n` + data.map((ch, i) => 
          `${i + 1}. 💬 **#${ch.name}** ${ch.is_private ? '🔒' : '🌐'}\n   👥 ${ch.member_count} members\n   📝 ${ch.topic || 'No topic'}`
        ).join('\n\n');
      }
    }

    // Docs - Search Results
    if (serverName === 'docs' && toolName === 'search_docs') {
      if (data.results && Array.isArray(data.results)) {
        return `Found ${data.results_count} results:\n` + data.results.map((doc, i) => 
          `${i + 1}. 📚 **${doc.title}**\n   🔗 ${doc.url}\n   📝 ${doc.snippet}`
        ).join('\n\n');
      }
    }

    // Default: Return formatted JSON
    return JSON.stringify(data, null, 2);
  } catch (err) {
    return JSON.stringify(data, null, 2);
  }
}

/* ------------------ Start MCP Servers ------------------ */
async function startAllServers() {
  const serversPath = path.join(__dirname, '../mcp-servers');

  await mcpManager.startServer(
    'github',
    'node',
    [path.join(serversPath, 'github-server/index.js')],
    { GITHUB_TOKEN: process.env.GITHUB_TOKEN }
  );

  await mcpManager.startServer(
    'jira',
    'node',
    [path.join(serversPath, 'jira-server/index.js')],
    {
      JIRA_HOST: process.env.JIRA_HOST,
      JIRA_EMAIL: process.env.JIRA_EMAIL,
      JIRA_API_TOKEN: process.env.JIRA_API_TOKEN,
    }
  );

  await mcpManager.startServer(
    'slack',
    'node',
    [path.join(serversPath, 'slack-server/index.js')],
    { SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN }
  );

  await mcpManager.startServer(
    'docs',
    'node',
    [path.join(serversPath, 'docs-server/index.js')]
  );

  console.log('✓ All MCP servers started');
}

/* ------------------ API: Tools ------------------ */
app.get('/api/tools', (req, res) => {
  res.json({ tools: mcpManager.getAllTools() });
});

/* ------------------ API: Chat (Gemini Agent Loop) ------------------ */
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    const tools = mcpManager.getAllTools();
    const executed = new Set();
    const toolsUsed = [];
    let iterations = 0;
    const MAX_ITER = 10;

    // Build conversation history
    let conversation = messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    while (iterations < MAX_ITER) {
      iterations++;

      // Build tool list for Gemini
      const toolList = tools
        .map(t => `- ${t.server}.${t.name}: ${t.description}`)
        .join('\n');

      const prompt = `${SYSTEM_PROMPT}

AVAILABLE TOOLS:
${toolList}

CONVERSATION:
${conversation}

USER'S LATEST REQUEST: ${messages[messages.length - 1].content}

Respond with JSON only.`;

      // Call Gemini
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();

      // Clean up markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (parseErr) {
        console.error('Failed to parse Gemini response:', text);
        // If parsing fails, treat as final response
        return res.json({
          response: text,
          thinking: `Completed in ${iterations} step(s)`
        });
      }

      // Handle final response
      if (parsed.action === 'response' || parsed.final || parsed.message) {
        const finalMessage = parsed.message || parsed.final || parsed.response || text;
        return res.json({
          response: finalMessage,
          thinking: toolsUsed.length > 0 
            ? `Used ${toolsUsed.length} tool(s): ${toolsUsed.join(', ')}` 
            : `Completed in ${iterations} step(s)`
        });
      }

      // Handle tool call
      if (parsed.action === 'tool' || parsed.tool) {
        const toolPath = parsed.tool;
        if (!toolPath || !toolPath.includes('.')) {
          return res.json({
            response: 'Invalid tool format. Please try again.',
            thinking: `Error at step ${iterations}`
          });
        }

        const [server, tool] = toolPath.split('.');
        const args = parsed.arguments || {};
        const key = `${toolPath}:${JSON.stringify(args)}`;

        // Prevent duplicate calls
        if (executed.has(key)) {
          return res.json({
            response: 'Tool already executed. Providing previous result.',
            thinking: `Stopped at step ${iterations} (duplicate)`
          });
        }

        executed.add(key);
        toolsUsed.push(`${server}.${tool}`);

        console.log(`[Step ${iterations}] Executing: ${toolPath} with args:`, args);

        try {
          // Execute tool via MCP
          const toolResult = await mcpManager.callTool(server, tool, args);

          // Parse the MCP response
          let resultData = toolResult;
          if (toolResult.content && Array.isArray(toolResult.content)) {
            const textContent = toolResult.content.find(c => c.type === 'text');
            if (textContent && textContent.text) {
              try {
                resultData = JSON.parse(textContent.text);
              } catch {
                resultData = textContent.text;
              }
            }
          }

          // Format the result nicely
          const formattedResult = formatToolResult(server, tool, resultData);

          // Add to conversation
          conversation += `\n\nTOOL_CALL: ${toolPath}(${JSON.stringify(args)})
TOOL_RESULT:
${formattedResult}

Now provide a natural, user-friendly response based on this data.`;

          // Continue loop to get Gemini's response
          continue;

        } catch (toolErr) {
          console.error('Tool execution error:', toolErr);
          conversation += `\n\nTOOL_ERROR: ${toolErr.message}`;
          continue;
        }
      }

      // If we get here, something unexpected happened
      return res.json({
        response: text || 'I processed your request.',
        thinking: `Completed in ${iterations} step(s)`
      });
    }

    res.json({
      response: 'Reached maximum iterations. Please try rephrasing your request.',
      thinking: `Stopped at ${MAX_ITER} steps`
    });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------------ API: Direct Tool Call (Manual Mode) ------------------ */
app.post('/api/tool/:server/:tool', async (req, res) => {
  try {
    const { server, tool } = req.params;
    const result = await mcpManager.callTool(server, tool, req.body);
    res.json(result);
  } catch (err) {
    console.error('Tool error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------------ Health ------------------ */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    servers: [...mcpManager.servers.keys()],
    toolsCount: mcpManager.getAllTools().length,
  });
});

/* ------------------ Start Server ------------------ */
app.listen(PORT, async () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
  await startAllServers();
});

/* ------------------ Cleanup ------------------ */
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  mcpManager.stopAll();
  process.exit(0);
});