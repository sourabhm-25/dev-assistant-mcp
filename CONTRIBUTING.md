# Contributing to AI Development Assistant

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/dev-assistant-mcp/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check [existing feature requests](https://github.com/yourusername/dev-assistant-mcp/issues?q=is%3Aissue+label%3Aenhancement)
2. Create a new issue with:
   - Clear use case
   - Proposed implementation (if you have ideas)
   - Why this feature would be valuable

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
   ```bash
   git commit -m "Add: Brief description of changes"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**

## 📝 Code Style Guidelines

### JavaScript/React
- Use ES6+ syntax
- Follow existing code formatting
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### File Structure
```javascript
// Imports
import React from 'react';

// Constants
const API_URL = 'http://localhost:3001';

// Component
export default function Component() {
  // State
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {}, []);
  
  // Handlers
  const handleClick = () => {};
  
  // Render
  return <div>...</div>;
}
```

### Naming Conventions
- **Components**: PascalCase (`DevAssistant.jsx`)
- **Functions**: camelCase (`handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`)
- **Files**: kebab-case (`mcp-manager.js`)

## 🧪 Testing

Before submitting a PR:

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing Checklist
- [ ] Backend starts without errors
- [ ] All MCP servers connect successfully
- [ ] Frontend connects to backend
- [ ] Chat mode works
- [ ] Manual mode works
- [ ] All tools execute correctly
- [ ] Error handling works
- [ ] UI is responsive

## 🏗️ Adding New MCP Servers

1. **Create server directory**
   ```bash
   mkdir mcp-servers/your-server
   cd mcp-servers/your-server
   npm init -y
   ```

2. **Install dependencies**
   ```bash
   npm install @modelcontextprotocol/sdk
   ```

3. **Implement MCP protocol**
   ```javascript
   import { Server } from '@modelcontextprotocol/sdk/server/index.js';
   
   const server = new Server({
     name: 'your-server',
     version: '1.0.0'
   }, {
     capabilities: { tools: {} }
   });
   
   server.setRequestHandler('tools/list', async () => {
     return { tools: [...] };
   });
   
   server.setRequestHandler('tools/call', async (request) => {
     // Implementation
   });
   ```

4. **Add to backend orchestrator**
   ```javascript
   // In backend/server.js
   await mcpManager.startServer(
     'your-server',
     'node',
     [path.join(serversPath, 'your-server/index.js')],
     { YOUR_API_KEY: process.env.YOUR_API_KEY }
   );
   ```

5. **Add frontend configuration**
   ```javascript
   // In frontend/src/App.jsx
   const SERVERS = {
     yourServer: {
       name: 'Your Service',
       icon: 'IconName',
       color: 'from-color-to-color',
       tools: [...]
     }
   };
   ```

## 🎨 Adding New Tools

1. **Define in MCP server**
   ```javascript
   server.setRequestHandler('tools/list', async () => {
     return {
       tools: [{
         name: 'your_tool',
         description: 'What it does',
         inputSchema: {
           type: 'object',
           properties: {
             param: { type: 'string', description: 'Parameter description' }
           },
           required: ['param']
         }
       }]
     };
   });
   ```

2. **Implement tool logic**
   ```javascript
   server.setRequestHandler('tools/call', async (request) => {
     const { name, arguments: args } = request.params;
     
     if (name === 'your_tool') {
       // Your implementation
       return {
         content: [{
           type: 'text',
           text: JSON.stringify(result)
         }]
       };
     }
   });
   ```

3. **Add to frontend config**
   ```javascript
   tools: [
     {
       name: 'your_tool',
       label: 'Your Tool',
       fields: [
         { name: 'param', label: 'Parameter', type: 'text', required: true }
       ]
     }
   ]
   ```

4. **Add output formatting**
   ```javascript
   const formatOutput = (data, serverName, toolName) => {
     if (serverName === 'your-server' && toolName === 'your_tool') {
       return `Formatted output: ${data.result}`;
     }
   };
   ```

## 📚 Documentation

When adding features:
- Update README.md
- Add JSDoc comments
- Update API documentation
- Add usage examples

## 🔍 Code Review Process

PRs will be reviewed for:
- Code quality and style
- Test coverage
- Documentation
- Performance implications
- Security concerns
- Breaking changes

## 🚀 Release Process

1. Version bump in package.json
2. Update CHANGELOG.md
3. Create release tag
4. Deploy to staging
5. Test thoroughly
6. Deploy to production

## 💬 Communication

- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions
- **Discussions**: General questions and ideas

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## 🙏 Thank You!

Every contribution helps make this project better. Whether it's fixing a typo, adding a feature, or reporting a bug - thank you for your time and effort!