# 🚀 Quick Start Guide

Get up and running in 5 minutes!

## ⚡ Super Fast Setup

```bash
# 1. Clone and navigate
git clone https://github.com/yourusername/dev-assistant-mcp.git
cd dev-assistant-mcp

# 2. Run setup script
chmod +x setup.sh
./setup.sh

# 3. Add your API keys to backend/.env
nano backend/.env

# 4. Start backend (Terminal 1)
cd backend && node server.js

# 5. Start frontend (Terminal 2)
cd frontend && npm run dev

# 6. Open browser
# http://localhost:5173
```

## 🔑 Minimum Required API Keys

You only need **2 keys** to get started:

### 1. Anthropic API Key (Required)
```bash
# Get it here: https://console.anthropic.com/
# $5 free credit included!
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 2. GitHub Token (Required)
```bash
# Get it here: https://github.com/settings/tokens
# Select: repo, read:user
GITHUB_TOKEN=ghp_xxxxx
```

## 📝 backend/.env Template

```env
# Required
ANTHROPIC_API_KEY=sk-ant-xxxxx
GITHUB_TOKEN=ghp_xxxxx

# Optional (leave blank to skip)
JIRA_HOST=
JIRA_EMAIL=
JIRA_API_TOKEN=

SLACK_BOT_TOKEN=

PORT=3001
```

## 🎯 First Commands to Try

### Chat Mode (AI Orchestration)
```
"List open PRs in facebook/react"
"Show me my GitHub repositories"
"Search for authentication in docs"
```

### Manual Mode
1. Click **Manual** button at top
2. Select **GitHub**
3. Choose **List Repositories**
4. Enter username: `torvalds`
5. Click **Execute**

## 🐛 Common Issues

### Backend won't start
```bash
# Check if port 3001 is free
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Kill process if needed
kill -9 <PID>
```

### Frontend shows "Disconnected"
```bash
# Make sure backend is running first
cd backend
node server.js

# Check if it's accessible
curl http://localhost:3001/api/health
```

### MCP Server errors
```bash
# Test individual server
cd mcp-servers/github-server
GITHUB_TOKEN=xxx node index.js

# Should show: "GitHub MCP Server running on stdio"
```

## 📚 What's Next?

- Read [README.md](README.md) for detailed documentation
- Check [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
- Star the repo if you find it useful! ⭐

## 💡 Pro Tips

1. **Use Chat Mode** for complex queries that need multiple tools
2. **Use Manual Mode** to learn what each tool does
3. **Check the metadata** line in responses to see which tools were used
4. **Press Enter** to send messages (Shift+Enter for new line in chat)

## 🎬 Example Workflows

### Developer Workflow
```
1. "List my recent PRs"
2. "Get details of PR #12345"
3. "Create a Jira ticket for this bug"
```

### Team Lead Workflow
```
1. "Show sprint issues"
2. "What did the team discuss today?"
3. "List high-priority bugs"
```

## 📊 System Requirements

- **Node.js**: 18 or higher
- **RAM**: 2GB minimum
- **Disk**: 500MB for dependencies
- **Browser**: Chrome, Firefox, Safari, Edge (latest)

## 🔒 Security Notes

- Never commit `.env` files
- Rotate API keys regularly
- Use read-only tokens when possible
- Review MCP server permissions

## 🤝 Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/dev-assistant-mcp/issues)
- **Questions**: [Discussions](https://github.com/yourusername/dev-assistant-mcp/discussions)
- **Documentation**: [Full README](README.md)

---

**Ready to dive deeper?** Check out the full [README.md](README.md)!