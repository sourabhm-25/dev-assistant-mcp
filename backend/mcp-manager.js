import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export class MCPManager extends EventEmitter {
  constructor() {
    super();
    this.servers = new Map();
    this.requestId = 0;
  }

  async startServer(name, command, args, env = {}) {
    if (this.servers.has(name)) return;

    const proc = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const server = {
      process: proc,
      pending: new Map(),
      tools: [],
      buffer: '',
    };

    this.servers.set(name, server);

    proc.stdout.on('data', (data) => this.#onStdout(name, data));
    proc.stderr.on('data', (d) =>
      console.log(`[${name}] ${d.toString().trim()}`)
    );

    proc.on('close', () => this.servers.delete(name));

    // 🔹 MCP handshake (REQUIRED)
    await this.sendRequest(name, 'initialize', {
      clientInfo: { name: 'mcp-manager', version: '1.0.0' },
      capabilities: {},
    });

    // 🔹 Load tools AFTER initialize
    await this.listTools(name);

    console.log(`✓ Started ${name} (${server.tools.length} tools)`);
  }

  #onStdout(name, data) {
    const server = this.servers.get(name);
    server.buffer += data.toString();

    let idx;
    while ((idx = server.buffer.indexOf('\n')) >= 0) {
      const line = server.buffer.slice(0, idx).trim();
      server.buffer = server.buffer.slice(idx + 1);

      if (!line) continue;

      try {
        const msg = JSON.parse(line);

        // Response
        if (msg.id !== undefined) {
          const pending = server.pending.get(msg.id);
          if (pending) {
            pending.resolve(msg.result);
            server.pending.delete(msg.id);
          }
        }

        // Notification
        if (msg.method && !msg.id) {
          this.emit('notification', name, msg);
        }
      } catch (err) {
        console.error(`[${name}] parse error`, err);
      }
    }
  }

  async sendRequest(serverName, method, params = {}) {
    const server = this.servers.get(serverName);
    if (!server) throw new Error(`Server ${serverName} not found`);

    const id = ++this.requestId;
    const payload = { jsonrpc: '2.0', id, method, params };

    return new Promise((resolve, reject) => {
      server.pending.set(id, { resolve, reject });
      server.process.stdin.write(JSON.stringify(payload) + '\n');

      setTimeout(() => {
        if (server.pending.has(id)) {
          server.pending.delete(id);
          reject(new Error(`${method} timeout`));
        }
      }, 30000);
    });
  }

  async listTools(serverName) {
    const res = await this.sendRequest(serverName, 'tools/list');
    const server = this.servers.get(serverName);
    server.tools = res?.tools ?? [];
    return server.tools;
  }

  async callTool(serverName, tool, args) {
    return this.sendRequest(serverName, 'tools/call', {
      name: tool,
      arguments: args,
    });
  }

  getAllTools() {
    return [...this.servers.entries()].flatMap(([name, s]) =>
      s.tools.map((t) => ({ ...t, server: name }))
    );
  }

  stopServer(name) {
    const s = this.servers.get(name);
    if (s) {
      s.process.kill();
      this.servers.delete(name);
    }
  }

  stopAll() {
    [...this.servers.keys()].forEach((n) => this.stopServer(n));
  }
}
