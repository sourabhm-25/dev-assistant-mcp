#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AI Development Assistant - Quick Setup Script       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed.${NC}"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm ${NPM_VERSION} found${NC}"
fi

echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"
echo ""

# Install MCP Servers
echo -e "${BLUE}[1/5] Installing GitHub MCP Server...${NC}"
cd mcp-servers/github-server
npm install --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ GitHub server installed${NC}"
else
    echo -e "${RED}✗ Failed to install GitHub server${NC}"
fi

echo -e "${BLUE}[2/5] Installing Jira MCP Server...${NC}"
cd ../jira-server
npm install --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Jira server installed${NC}"
else
    echo -e "${RED}✗ Failed to install Jira server${NC}"
fi

echo -e "${BLUE}[3/5] Installing Slack MCP Server...${NC}"
cd ../slack-server
npm install --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Slack server installed${NC}"
else
    echo -e "${RED}✗ Failed to install Slack server${NC}"
fi

echo -e "${BLUE}[4/5] Installing Docs MCP Server...${NC}"
cd ../docs-server
npm install --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docs server installed${NC}"
else
    echo -e "${RED}✗ Failed to install Docs server${NC}"
fi

# Install Backend
echo -e "${BLUE}[5/5] Installing Backend...${NC}"
cd ../../backend
npm install --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend installed${NC}"
else
    echo -e "${RED}✗ Failed to install Backend${NC}"
fi

# Install Frontend
echo -e "${BLUE}[6/6] Installing Frontend...${NC}"
cd ../frontend
npm install --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend installed${NC}"
else
    echo -e "${RED}✗ Failed to install Frontend${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Installation Complete! 🎉                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for .env files
echo -e "${YELLOW}Checking configuration...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${RED}⚠ backend/.env not found${NC}"
    echo -e "${YELLOW}Creating template...${NC}"
    
    cat > backend/.env << 'EOF'
# Anthropic API (REQUIRED)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# GitHub (REQUIRED)
GITHUB_TOKEN=your_github_token_here

# Jira (OPTIONAL)
JIRA_HOST=yourcompany.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your_jira_api_token_here

# Slack (OPTIONAL)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here

# Server Config
PORT=3001
EOF
    
    echo -e "${GREEN}✓ Created backend/.env template${NC}"
    echo -e "${YELLOW}  Please edit backend/.env and add your API keys${NC}"
else
    echo -e "${GREEN}✓ backend/.env exists${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}Creating frontend/.env...${NC}"
    
    cat > frontend/.env << 'EOF'
VITE_BACKEND_URL=http://localhost:3001
EOF
    
    echo -e "${GREEN}✓ Created frontend/.env${NC}"
else
    echo -e "${GREEN}✓ frontend/.env exists${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   Next Steps                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}1. Get your API keys:${NC}"
echo -e "   • Anthropic: ${BLUE}https://console.anthropic.com/${NC}"
echo -e "   • GitHub: ${BLUE}https://github.com/settings/tokens${NC}"
echo -e "   • Jira (optional): ${BLUE}https://id.atlassian.com/manage-profile/security/api-tokens${NC}"
echo -e "   • Slack (optional): ${BLUE}https://api.slack.com/apps${NC}"
echo ""
echo -e "${YELLOW}2. Add keys to ${BLUE}backend/.env${NC}"
echo ""
echo -e "${YELLOW}3. Start the backend:${NC}"
echo -e "   ${GREEN}cd backend && node server.js${NC}"
echo ""
echo -e "${YELLOW}4. In a new terminal, start the frontend:${NC}"
echo -e "   ${GREEN}cd frontend && npm run dev${NC}"
echo ""
echo -e "${YELLOW}5. Open your browser:${NC}"
echo -e "   ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""