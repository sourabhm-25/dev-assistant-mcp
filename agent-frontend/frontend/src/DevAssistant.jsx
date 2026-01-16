import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Brain, Zap, CheckCircle2, AlertCircle, Server, RefreshCw, Github, MessageSquare, FileText, Settings } from 'lucide-react';

const BACKEND_URL = 'http://localhost:3001';
const MAX_HISTORY = 20;

const SERVERS = {
  github: {
    name: 'GitHub',
    icon: 'Github',
    color: 'from-gray-700 to-gray-900',
    tools: [
      { 
        name: 'list_repositories', 
        label: 'List Repositories',
        fields: [
          { name: 'username', label: 'Username/Org', type: 'text', placeholder: 'facebook', required: true },
          { name: 'type', label: 'Type', type: 'select', options: ['all', 'owner', 'member'], default: 'all' }
        ]
      },
      { 
        name: 'list_pull_requests', 
        label: 'List Pull Requests',
        fields: [
          { name: 'owner', label: 'Owner', type: 'text', placeholder: 'facebook', required: true },
          { name: 'repo', label: 'Repository', type: 'text', placeholder: 'react', required: true },
          { name: 'state', label: 'State', type: 'select', options: ['open', 'closed', 'all'], default: 'open' }
        ]
      },
      { 
        name: 'get_pull_request', 
        label: 'Get PR Details',
        fields: [
          { name: 'owner', label: 'Owner', type: 'text', placeholder: 'facebook', required: true },
          { name: 'repo', label: 'Repository', type: 'text', placeholder: 'react', required: true },
          { name: 'pull_number', label: 'PR Number', type: 'number', placeholder: '12345', required: true }
        ]
      },
      { 
        name: 'list_issues', 
        label: 'List Issues',
        fields: [
          { name: 'owner', label: 'Owner', type: 'text', placeholder: 'facebook', required: true },
          { name: 'repo', label: 'Repository', type: 'text', placeholder: 'react', required: true },
          { name: 'state', label: 'State', type: 'select', options: ['open', 'closed', 'all'], default: 'open' }
        ]
      },
      { 
        name: 'create_issue', 
        label: 'Create Issue',
        fields: [
          { name: 'owner', label: 'Owner', type: 'text', required: true },
          { name: 'repo', label: 'Repository', type: 'text', required: true },
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'body', label: 'Description', type: 'textarea' }
        ]
      }
    ]
  },
  jira: {
    name: 'Jira',
    icon: 'Box',
    color: 'from-blue-600 to-blue-800',
    tools: [
      { 
        name: 'search_issues', 
        label: 'Search Issues (JQL)',
        fields: [
          { name: 'jql', label: 'JQL Query', type: 'text', placeholder: 'project = PROJ AND status = Open', required: true },
          { name: 'max_results', label: 'Max Results', type: 'number', default: '10' }
        ]
      },
      { 
        name: 'get_issue', 
        label: 'Get Issue Details',
        fields: [
          { name: 'issue_key', label: 'Issue Key', type: 'text', placeholder: 'PROJ-123', required: true }
        ]
      },
      { 
        name: 'create_issue', 
        label: 'Create Issue',
        fields: [
          { name: 'project_key', label: 'Project Key', type: 'text', placeholder: 'PROJ', required: true },
          { name: 'summary', label: 'Summary', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'issue_type', label: 'Type', type: 'select', options: ['Task', 'Bug', 'Story'], default: 'Task' }
        ]
      },
      { 
        name: 'list_projects', 
        label: 'List Projects',
        fields: []
      }
    ]
  },
  slack: {
    name: 'Slack',
    icon: 'MessageSquare',
    color: 'from-purple-600 to-purple-800',
    tools: [
      { 
        name: 'list_channels', 
        label: 'List Channels',
        fields: []
      },
      { 
        name: 'get_channel_history', 
        label: 'Get Messages',
        fields: [
          { name: 'channel_id', label: 'Channel ID', type: 'text', placeholder: 'C01234567', required: true },
          { name: 'limit', label: 'Limit', type: 'number', default: '10' }
        ]
      },
      { 
        name: 'post_message', 
        label: 'Post Message',
        fields: [
          { name: 'channel_id', label: 'Channel', type: 'text', placeholder: '#general', required: true },
          { name: 'text', label: 'Message', type: 'textarea', required: true }
        ]
      },
      { 
        name: 'search_messages', 
        label: 'Search Messages',
        fields: [
          { name: 'query', label: 'Query', type: 'text', required: true }
        ]
      }
    ]
  },
  docs: {
    name: 'Docs',
    icon: 'FileText',
    color: 'from-green-600 to-green-800',
    tools: [
      { 
        name: 'index_url', 
        label: 'Index URL',
        fields: [
          { name: 'url', label: 'URL', type: 'text', placeholder: 'https://docs.example.com', required: true }
        ]
      },
      { 
        name: 'search_docs', 
        label: 'Search Docs',
        fields: [
          { name: 'query', label: 'Query', type: 'text', required: true }
        ]
      },
      { 
        name: 'add_custom_doc', 
        label: 'Add Custom Doc',
        fields: [
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'content', label: 'Content', type: 'textarea', required: true }
        ]
      },
      { 
        name: 'list_documents', 
        label: 'List Documents',
        fields: []
      }
    ]
  }
};

export default function DevAssistant() {
  const [mode, setMode] = useState('chat');
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedTool, setSelectedTool] = useState('');
  const [toolInputs, setToolInputs] = useState({});
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "👋 Hi! I'm your AI Development Assistant.\n\n🤖 Chat Mode: AI orchestrates tools automatically\n⚙️ Manual Mode: Select and execute specific tools" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState('');
  const [serverStatus, setServerStatus] = useState({ connected: false, tools: 0, servers: [] });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingStatus]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`);
      const data = await res.json();
      setServerStatus({ connected: true, tools: data.toolsCount || 0, servers: data.servers || [] });
    } catch {
      setServerStatus({ connected: false, tools: 0, servers: [] });
    }
  };

  const handleChatSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage].slice(-MAX_HISTORY);
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setThinkingStatus('🤔 AI analyzing your request...');

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      if (!res.ok) throw new Error(`Backend error ${res.status}`);
      const data = await res.json();
      
      // Clean up the response - remove technical details
      let cleanResponse = data.response;
      
      // Remove JSON-RPC call details if present
      cleanResponse = cleanResponse.replace(/```json[\s\S]*?```/g, '');
      cleanResponse = cleanResponse.replace(/\{[\s\S]*?"tool":\s*"[^"]*"[\s\S]*?\}/g, '');
      cleanResponse = cleanResponse.trim();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: cleanResponse, 
        metadata: data.thinking 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        isError: true, 
        content: `❌ Error: ${err.message}\n\nPlease check:\n• Backend is running\n• API keys are configured\n• MCP servers are connected` 
      }]);
    } finally {
      setIsLoading(false);
      setThinkingStatus('');
    }
  };

  const handleManualExecute = async () => {
    if (!selectedServer || !selectedTool) return;
    const server = SERVERS[selectedServer];
    const tool = server.tools.find(t => t.name === selectedTool);
    const missing = tool.fields.filter(f => f.required && !toolInputs[f.name]).map(f => f.label);
    if (missing.length > 0) {
      alert(`Missing: ${missing.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setThinkingStatus(`⚙️ Executing ${server.name} → ${tool.label}...`);

    try {
      const args = {};
      tool.fields.forEach(field => {
        let value = toolInputs[field.name] || field.default || '';
        if (field.type === 'number' && value) value = parseInt(value);
        if (value !== '') args[field.name] = value;
      });

      const res = await fetch(`${BACKEND_URL}/api/tool/${selectedServer}/${selectedTool}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      if (!res.ok) throw new Error(`Failed ${res.status}`);
      const data = await res.json();
      
      // Format the response nicely
      let formattedContent = '';
      let parsedData = null;
      
      // Handle different response formats
      if (data.content && Array.isArray(data.content)) {
        // MCP server response format
        const textContent = data.content.find(c => c.type === 'text');
        if (textContent && textContent.text) {
          try {
            parsedData = JSON.parse(textContent.text);
          } catch {
            formattedContent = textContent.text;
          }
        }
      } else if (data) {
        parsedData = data;
      }
      
      // Apply formatting if we have parsed data
      if (parsedData) {
        formattedContent = formatOutput(parsedData, selectedServer, selectedTool);
      } else if (!formattedContent) {
        formattedContent = JSON.stringify(data, null, 2);
      }
      
      setMessages(prev => [
        ...prev,
        { role: 'user', content: `🔧 ${server.name} → ${tool.label}\n${JSON.stringify(args, null, 2)}`, isManual: true },
        { role: 'assistant', content: formattedContent, metadata: '✅ Success' }
      ]);
      setToolInputs({});
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', isError: true, content: `❌ ${err.message}` }]);
    } finally {
      setIsLoading(false);
      setThinkingStatus('');
    }
  };

  const currentServer = selectedServer ? SERVERS[selectedServer] : null;
  const currentTool = currentServer && selectedTool ? currentServer.tools.find(t => t.name === selectedTool) : null;

  const getIcon = (iconName) => {
    const icons = { Github, MessageSquare, FileText };
    return icons[iconName] || Server;
  };

  // Format output based on tool type
  const formatOutput = (data, serverName, toolName) => {
    try {
      console.log('Formatting:', { serverName, toolName, dataType: typeof data, isArray: Array.isArray(data) });
      
      // GitHub - List Repositories
      if (serverName === 'github' && toolName === 'list_repositories') {
        if (Array.isArray(data)) {
          return `📦 Found ${data.length} repositories:\n\n` + data.map((repo, i) => 
            `${i + 1}. ${repo.name}\n   ⭐ ${repo.stars || 0} stars | 🔤 ${repo.language || 'N/A'}\n   📝 ${repo.description || 'No description'}\n   🔗 ${repo.url}`
          ).join('\n\n');
        }
      }

      // GitHub - List PRs
      if (serverName === 'github' && toolName === 'list_pull_requests') {
        if (Array.isArray(data)) {
          return `🔀 Found ${data.length} pull requests:\n\n` + data.map((pr, i) => 
            `${i + 1}. #${pr.number} - ${pr.title}\n   👤 ${pr.author} | 📊 ${pr.state}\n   🔗 ${pr.url}`
          ).join('\n\n');
        }
      }

      // GitHub - Get PR Details
      if (serverName === 'github' && toolName === 'get_pull_request') {
        return `🔀 Pull Request #${data.number}\n\n` +
          `📝 Title: ${data.title}\n` +
          `👤 Author: ${data.author}\n` +
          `📊 State: ${data.state}\n` +
          `${data.merged ? '✅ Merged' : '⏳ Not merged'}\n` +
          `📁 Files changed: ${data.files_changed}\n` +
          `➕ Additions: ${data.additions} | ➖ Deletions: ${data.deletions}\n` +
          `💬 Commits: ${data.commits}\n` +
          `🔗 ${data.url}\n\n` +
          `Description:\n${data.body || 'No description'}`;
      }

      // GitHub - List Issues
      if (serverName === 'github' && toolName === 'list_issues') {
        if (Array.isArray(data)) {
          return `🐛 Found ${data.length} issues:\n\n` + data.map((issue, i) => 
            `${i + 1}. #${issue.number} - ${issue.title}\n   👤 ${issue.author} | 📊 ${issue.state}\n   🏷️ ${issue.labels.join(', ') || 'No labels'}\n   🔗 ${issue.url}`
          ).join('\n\n');
        }
      }

      // Jira - Search Issues
      if (serverName === 'jira' && toolName === 'search_issues') {
        if (data.issues && Array.isArray(data.issues)) {
          return `🎯 Found ${data.total} issues:\n\n` + data.issues.map((issue, i) => 
            `${i + 1}. ${issue.key} - ${issue.summary}\n   📊 ${issue.status} | 🔴 ${issue.priority}\n   👤 ${issue.assignee}`
          ).join('\n\n');
        }
      }

      // Jira - Get Issue
      if (serverName === 'jira' && toolName === 'get_issue') {
        return `🎯 ${data.key}\n\n` +
          `📝 Summary: ${data.summary}\n` +
          `📊 Status: ${data.status}\n` +
          `🔴 Priority: ${data.priority}\n` +
          `📋 Type: ${data.issue_type}\n` +
          `👤 Assignee: ${data.assignee}\n` +
          `👥 Reporter: ${data.reporter}\n\n` +
          `Description:\n${data.description || 'No description'}\n\n` +
          `💬 Comments (${data.comments?.length || 0}):\n` +
          (data.comments?.map(c => `  • ${c.author}: ${c.body}`).join('\n') || '  No comments');
      }

      // Jira - List Projects
      if (serverName === 'jira' && toolName === 'list_projects') {
        if (Array.isArray(data)) {
          return `📂 Found ${data.length} projects:\n\n` + data.map((proj, i) => 
            `${i + 1}. ${proj.key} - ${proj.name}\n   📋 Type: ${proj.type}\n   👤 Lead: ${proj.lead}`
          ).join('\n\n');
        }
      }

      // Slack - List Channels
      if (serverName === 'slack' && toolName === 'list_channels') {
        if (Array.isArray(data)) {
          return `💬 Found ${data.length} channels:\n\n` + data.map((ch, i) => 
            `${i + 1}. #${ch.name} ${ch.is_private ? '🔒' : '🌐'}\n   👥 ${ch.member_count} members\n   📝 ${ch.topic || 'No topic'}`
          ).join('\n\n');
        }
      }

      // Slack - Channel History
      if (serverName === 'slack' && toolName === 'get_channel_history') {
        if (Array.isArray(data)) {
          return `💬 Found ${data.length} messages:\n\n` + data.map((msg, i) => 
            `${i + 1}. ${msg.user}: ${msg.text}\n   🕐 ${new Date(parseFloat(msg.timestamp) * 1000).toLocaleString()}`
          ).join('\n\n');
        }
      }

      // Slack - Search Results
      if (serverName === 'slack' && toolName === 'search_messages') {
        if (data.messages && Array.isArray(data.messages)) {
          return `🔍 Found ${data.total} messages:\n\n` + data.messages.map((msg, i) => 
            `${i + 1}. ${msg.user} in #${msg.channel}:\n   ${msg.text}\n   🔗 ${msg.permalink}`
          ).join('\n\n');
        }
      }

      // Docs - Search Results
      if (serverName === 'docs' && toolName === 'search_docs') {
        if (data.results && Array.isArray(data.results)) {
          return `📚 Found ${data.results_count} results:\n\n` + data.results.map((doc, i) => 
            `${i + 1}. ${doc.title}\n   🔗 ${doc.url}\n   📝 ${doc.snippet}`
          ).join('\n\n');
        }
      }

      // Docs - List Documents
      if (serverName === 'docs' && toolName === 'list_documents') {
        if (data.documents && Array.isArray(data.documents)) {
          return `📚 Found ${data.total} documents:\n\n` + data.documents.map((doc, i) => 
            `${i + 1}. ${doc.title}\n   🔗 ${doc.url}\n   🏷️ ${doc.tags?.join(', ') || 'No tags'}`
          ).join('\n\n');
        }
      }

      // Default: Pretty print JSON
      return JSON.stringify(data, null, 2);
    } catch (err) {
      return JSON.stringify(data, null, 2);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <Brain className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Dev Assistant</h1>
                <p className="text-xs text-gray-400">MCP-powered AI with 4 servers</p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setMode('chat')}
                  className={`px-4 py-2 rounded text-sm font-medium ${mode === 'chat' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
                >
                  🤖 Chat
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className={`px-4 py-2 rounded text-sm font-medium ${mode === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                >
                  ⚙️ Manual
                </button>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${serverStatus.connected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                <Server className="w-4 h-4" />
                {serverStatus.connected ? `${serverStatus.servers.length} servers` : 'Offline'}
              </div>
              <button onClick={checkHealth} className="p-2 hover:bg-white/10 rounded-lg">
                <RefreshCw className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>
          {serverStatus.connected && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {serverStatus.servers.map(s => (
                <span key={s} className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-xs text-gray-300">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />{s}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {mode === 'manual' && (
          <aside className="w-96 bg-white/5 border-r border-white/10 p-4 overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />Tool Config
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">1. Select Server</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(SERVERS).map(([key, server]) => {
                  const Icon = getIcon(server.icon);
                  return (
                    <button
                      key={key}
                      onClick={() => { setSelectedServer(key); setSelectedTool(''); setToolInputs({}); }}
                      className={`p-3 rounded-lg border-2 ${selectedServer === key ? `bg-gradient-to-r ${server.color} border-white/50` : 'bg-white/5 border-white/10'}`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-1 ${selectedServer === key ? 'text-white' : 'text-gray-400'}`} />
                      <p className="text-xs font-medium text-white">{server.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            {currentServer && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">2. Select Tool</label>
                <select
                  value={selectedTool}
                  onChange={(e) => { setSelectedTool(e.target.value); setToolInputs({}); }}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-slate-800 [&>option]:text-white"
                >
                  <option value="" className="bg-slate-800 text-gray-400">Choose...</option>
                  {currentServer.tools.map(t => <option key={t.name} value={t.name} className="bg-slate-800 text-white">{t.label}</option>)}
                </select>
              </div>
            )}
            {currentTool && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">3. Parameters</label>
                <div className="space-y-3">
                  {currentTool.fields.map(field => (
                    <div key={field.name}>
                      <label className="block text-xs text-gray-400 mb-1">
                        {field.label}{field.required && <span className="text-red-400">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={toolInputs[field.name] || ''}
                          onChange={(e) => setToolInputs(p => ({ ...p, [field.name]: e.target.value }))}
                          placeholder={field.placeholder}
                          rows={3}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={toolInputs[field.name] || field.default || ''}
                          onChange={(e) => setToolInputs(p => ({ ...p, [field.name]: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                        >
                          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={toolInputs[field.name] || ''}
                          onChange={(e) => setToolInputs(p => ({ ...p, [field.name]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleManualExecute}
                  disabled={isLoading}
                  className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  Execute
                </button>
              </div>
            )}
          </aside>
        )}

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-5xl mx-auto space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 ${m.role === 'user' ? (m.isManual ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white') : m.isError ? 'bg-red-500/20 text-red-200 border border-red-500/40' : 'bg-white/10 text-white border border-white/20'}`}>
                    {m.metadata && (
                      <div className="text-xs text-purple-300 mb-2 pb-2 border-b border-white/10 flex items-center gap-2">
                        <Zap className="w-3 h-3" />{m.metadata}
                      </div>
                    )}
                    <pre className="whitespace-pre-wrap font-sans text-sm">{m.content}</pre>
                  </div>
                </div>
              ))}
              {thinkingStatus && (
                <div className="flex">
                  <div className="bg-yellow-500/20 text-yellow-200 border border-yellow-500/40 rounded-xl p-3 flex gap-3 items-center">
                    <Loader className="w-5 h-5 animate-spin" />{thinkingStatus}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {mode === 'chat' && (
            <footer className="bg-white/10 border-t border-white/20 p-4">
              <div className="max-w-5xl mx-auto">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleChatSend())}
                    disabled={!serverStatus.connected || isLoading}
                    placeholder="Ask AI to orchestrate tools..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!input.trim() || isLoading || !serverStatus.connected}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold flex items-center gap-2"
                  >
                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
                {!serverStatus.connected && (
                  <div className="mt-3 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <div>Run: <code>cd backend && node server.js</code></div>
                  </div>
                )}
              </div>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}