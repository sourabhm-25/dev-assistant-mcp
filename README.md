# 🤖 AI Development Assistant with MCP Integration

A powerful AI-powered development assistant that integrates **GitHub, Jira, Slack, and Documentation** tools through the Model Context Protocol (MCP). Features intelligent orchestration and manual tool execution modes.

![Dev Assistant](https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge)
![MCP](https://img.shields.io/badge/MCP-Integrated-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)


## ✨ Features

### 🤖 **Dual Mode Interface**
- **Chat Mode**: AI automatically orchestrates multiple tools to answer your queries
- **Manual Mode**: Directly select and execute specific tools with custom parameters

### 🔧 **Integrated Tools**
- **GitHub** (7 tools): Repositories, PRs, Issues, Commits, Code Search
- **Jira** (7 tools): Issue Management, Sprint Data, JQL Search
- **Slack** (8 tools): Channels, Messages, Search, Notifications
- **Documentation** (7 tools): Index, Search, Custom Docs

### 🎯 **Key Capabilities**
- Multi-step task automation
- Intelligent tool selection
- Sequential and parallel tool execution
- Real-time status monitoring
- Beautiful formatted outputs
- Context-aware conversations

## 🏗️ Architecture

```mermaid
flowchart LR
  %% Frontend
  FE["React Frontend (Vite)"]
  FE -->|"Chat / Manual"| API

  %% Backend Core
  API["Express API"]
  Claude["Gemini/Claude/OpenAI API"]
  Orchestrator["Tool Orchestrator"]
  MCP["MCP Manager"]

  API --> Claude
  API --> Orchestrator
  Orchestrator --> MCP

  %% MCP Servers
  MCP --> GH_MCP["GitHub MCP"]
  MCP --> Jira_MCP["Jira MCP"]
  MCP --> Slack_MCP["Slack MCP"]
  MCP --> Docs_MCP["Docs MCP"]

  %% External APIs
  GH_MCP --> GH_API["GitHub API"]
  Jira_MCP --> Jira_API["Jira API"]
  Slack_MCP --> Slack_API["Slack API"]
  Docs_MCP --> Docs_API["Docs API"]
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- GitHub account and personal access token
- Jira account (optional)
- Slack workspace and bot token (optional)
- Anthropic API key (Claude)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/dev-assistant-mcp.git
cd dev-assistant-mcp
```

2. **Install MCP Server Dependencies**
```bash
# GitHub Server
cd mcp-servers/github-server
npm install

# Jira Server
cd ../jira-server
npm install

# Slack Server
cd ../slack-server
npm install

# Docs Server
cd ../docs-server
npm install
```

3. **Install Backend Dependencies**
```bash
cd ../../backend
npm install
```

4. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

5. **Configure Environment Variables**

Create `backend/.env`:
```env
# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key

# GitHub
GITHUB_TOKEN=your_github_personal_access_token

# Jira (Optional)
JIRA_HOST=yourcompany.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your_jira_api_token

# Slack (Optional)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token

# Server Config
PORT=3001
```

Create `frontend/.env`:
```env
VITE_BACKEND_URL=http://localhost:3001
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access the application at: `http://localhost:5173`

## 🔑 Getting API Keys

### 1. Anthropic API Key (Required)
- Visit: https://console.anthropic.com/
- Sign up and get $5 free credit
- Create API key in settings

### 2. GitHub Personal Access Token (Required)
- Go to: https://github.com/settings/tokens
- Generate new token (classic)
- Select scopes: `repo`, `read:user`
- Copy and save the token

### 3. Jira API Token (Optional)
- Visit: https://id.atlassian.com/manage-profile/security/api-tokens
- Click "Create API token"
- Copy the token

### 4. Slack Bot Token (Optional)
- Go to: https://api.slack.com/apps
- Create new app → "From scratch"
- Add OAuth scopes:
  - `channels:history`
  - `channels:read`
  - `chat:write`
  - `users:read`
  - `search:read`
  - `reactions:write`
- Install app to workspace
- Copy "Bot User OAuth Token"

## 📖 Usage Examples

### Chat Mode (AI Orchestration)

Ask natural language questions and let AI handle the tools:

```
💬 "List all open PRs in facebook/react"
🤖 AI uses: GitHub → list_pull_requests

💬 "Create a Jira ticket for the bug in PR #12345"
🤖 AI uses: GitHub → get_pull_request, then Jira → create_issue

💬 "What did the team discuss in #engineering today?"
🤖 AI uses: Slack → get_channel_history

💬 "Search documentation for authentication examples"
🤖 AI uses: Docs → search_docs
```

### Manual Mode (Direct Tool Execution)

1. Select server (GitHub, Jira, Slack, Docs)
2. Choose tool from dropdown
3. Fill in parameters
4. Click Execute

**Example: Get PR Details**
```
Server: GitHub
Tool: Get Pull Request Details
Owner: torvalds
Repo: linux
PR Number: 12345
→ Execute
```

## 🛠️ Available Tools

### GitHub Tools
| Tool | Description |
|------|-------------|
| `list_repositories` | List repos for a user/org |
| `list_pull_requests` | List PRs in a repository |
| `get_pull_request` | Get detailed PR information |
| `list_issues` | List issues with filters |
| `get_commits` | Get recent commits |
| `create_issue` | Create a new issue |
| `search_code` | Search code across GitHub |

### Jira Tools
| Tool | Description |
|------|-------------|
| `search_issues` | Search using JQL |
| `get_issue` | Get issue details |
| `create_issue` | Create new issue |
| `update_issue` | Update existing issue |
| `add_comment` | Add comment to issue |
| `get_sprint_issues` | Get sprint items |
| `list_projects` | List all projects |

### Slack Tools
| Tool | Description |
|------|-------------|
| `list_channels` | List workspace channels |
| `get_channel_history` | Get channel messages |
| `post_message` | Post message to channel |
| `search_messages` | Search messages |
| `get_user_info` | Get user details |
| `list_users` | List workspace users |
| `add_reaction` | Add emoji reaction |
| `get_thread_replies` | Get thread messages |

### Documentation Tools
| Tool | Description |
|------|-------------|
| `index_url` | Index a documentation URL |
| `search_docs` | Search indexed docs |
| `get_document` | Get full document |
| `list_documents` | List all indexed docs |
| `add_custom_doc` | Add custom document |
| `delete_document` | Remove document |
| `fetch_and_search` | One-time fetch & search |

## 🎨 Screenshots

### Chat Mode
![Chat Mode](Screenshots/chat-mode.jpeg)

### Manual Mode
![Manual Mode](Screenshots/manual-mode.png)

### Tool Execution
![Tool Execution](Screenshots/tool-execution.png)

## 🏆 Use Cases

### For Developers
- Quick PR reviews and status checks
- Code search across repositories
- Issue tracking and management
- Team collaboration insights

### For Project Managers
- Sprint planning and tracking
- Issue prioritization
- Team communication monitoring
- Progress reporting

### For DevOps
- Deployment notifications
- Incident management
- Documentation updates
- Cross-tool automation

## 🔧 Advanced Configuration

### Custom MCP Servers

Add your own MCP server:

1. Create server in `mcp-servers/your-server/`
2. Implement MCP protocol with tools
3. Update `backend/server.js` to start your server
4. Add tool definitions to frontend

### Adding New Tools

1. Define tool in MCP server's `tools/list` handler
2. Implement tool logic in `tools/call` handler
3. Add frontend configuration in `SERVERS` object
4. Update formatting in `formatOutput` function

## 📊 Project Structure

```
dev-assistant-mcp/
├── mcp-servers/              # MCP Protocol Servers
│   ├── github-server/        # GitHub integration
│   │   ├── index.js
│   │   └── package.json
│   ├── jira-server/          # Jira integration
│   │   ├── index.js
│   │   └── package.json
│   ├── slack-server/         # Slack integration
│   │   ├── index.js
│   │   └── package.json
│   └── docs-server/          # Documentation
│       ├── index.js
│       └── package.json
├── backend/                  # Orchestration Layer
│   ├── server.js            # Express API
│   ├── mcp-manager.js       # MCP process manager
│   ├── package.json
│   └── .env
├── frontend/                 # React UI
│   ├── src/
│   │   ├── App.jsx          # Main component
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env
├── screenshots/              # Demo images
├── README.md
└── LICENSE
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if ports are available
lsof -i :3001

# Verify environment variables
cat backend/.env

# Check MCP server dependencies
cd mcp-servers/github-server && npm install
```

### Frontend shows "Disconnected"
```bash
# Ensure backend is running
curl http://localhost:3001/api/health

# Check CORS settings in backend
# Verify VITE_BACKEND_URL in frontend/.env
```

### MCP Server errors
```bash
# Check individual server logs
cd mcp-servers/github-server
GITHUB_TOKEN=xxx node index.js

# Test with manual JSON-RPC request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node index.js
```

### API Rate Limits
- GitHub: 5000 requests/hour (authenticated)
- Jira: Varies by plan
- Slack: Tier-based limits
- Anthropic: Based on plan

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Test all MCP servers before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude API
- [Model Context Protocol](https://modelcontextprotocol.io/) specification
- [GitHub API](https://docs.github.com/en/rest)
- [Atlassian Jira API](https://developer.atlassian.com/cloud/jira/)
- [Slack API](https://api.slack.com/)
