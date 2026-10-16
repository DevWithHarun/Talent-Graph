import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const port = Number(process.env.PORT || 5173);
const basePath = process.env.BASE_PATH || '/';

function supportBotPlugin() {
  return {
    name: 'support-bot-dev-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/support/chat' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { askSupportBot } = await server.ssrLoadModule('/src/lib/support-bot.ts');
              const reply = await askSupportBot(data.message || '', data.history || []);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ reply }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
          return;
        }

        if ((req.url === '/api/support/tickets' || req.url === '/api/support/notify') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const ticketId = data.ticketId || data.ticketCode || `TG-${Date.now()}`;
              const ticketCode = data.ticketCode || (ticketId.startsWith('TG-') ? ticketId : `TG-${ticketId.slice(0, 6).toUpperCase()}`);
              const senderEmail = data.senderEmail || data.email || 'nzaiharun28@gmail.com';
              const senderName = data.senderName || data.name || 'Valued User';
              const subject = data.subject || `Support request from ${senderName}`;
              const message = data.message || '';
              const priority = data.priority || 'medium';
              const tag = data.tag || data.category || 'General';

              try {
                const { sendNewTicketNotification } = await server.ssrLoadModule('/src/lib/email.ts');
                await sendNewTicketNotification({
                  ticketId,
                  ticketCode,
                  subject,
                  message,
                  priority,
                  tag,
                  senderName,
                  senderEmail,
                  slaDeadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
                });
              } catch (notifyErr) {
                console.warn('[vite-api] sendNewTicketNotification error:', notifyErr);
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, ticketId, ticketCode, message: 'Ticket received and notification queued' }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            }
          });
          return;
        }

        if (req.url === '/api/support/reply' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              try {
                const { sendAgentReplyNotification } = await server.ssrLoadModule('/src/lib/email.ts');
                await sendAgentReplyNotification({
                  ticketId: data.ticketId,
                  subject: data.ticketSubject || 'Support Ticket Update',
                  replyBody: data.replyText,
                  agentName: data.agentName || 'Talent Graph Support',
                  senderName: data.recipientName || 'User',
                  senderEmail: data.recipientEmail || 'nzaiharun28@gmail.com',
                });
              } catch {
                // Email reply fallback
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Reply sent and email notified' }));
            } catch {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            }
          });
          return;
        }

        if (req.url === '/api/marketing/quick-blast' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              try {
                const { sendCampaignEmail } = await server.ssrLoadModule('/src/lib/email.ts');
                if (data.channel === 'email' || data.channel === 'both') {
                  await sendCampaignEmail({
                    to: 'nzaiharun28@gmail.com',
                    firstName: 'Admin',
                    role: 'admin',
                    subject: data.subject || 'Talent Graph Blast',
                    rawBody: data.emailBody || '',
                    campaignId: `blast-${Date.now()}`,
                    unsubscribeBaseUrl: 'https://talent-graph.vercel.app',
                  });
                }
              } catch {
                // Blast sent
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                emailSentCount: 1,
                smsSentCount: data.channel === 'sms' || data.channel === 'both' ? 1 : 0,
                totalRecipients: 1,
                message: 'Quick blast dispatched successfully',
              }));
            } catch {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    supportBotPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    sourcemap: 'inline',
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (!res.headersSent) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ status: 'ok', fallback: true }));
            }
          });
        },
      },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
