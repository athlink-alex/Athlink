require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { execFile } = require('child_process');
const path = require('path');

const ALLOWED_PHONE = process.env.ALLOWED_PHONE;
const CLAUDE_CWD = process.env.CLAUDE_CWD || process.cwd();
const CLAUDE_CLI_PATH = process.env.CLAUDE_CLI_PATH || 'claude';
const COMMAND_TIMEOUT_MS = 120_000; // 2 minutes

if (!ALLOWED_PHONE || ALLOWED_PHONE === '1234567890') {
  console.error('ERROR: Set your phone number in .env (ALLOWED_PHONE with country code, no + or spaces)');
  process.exit(1);
}

// WhatsApp client with session persistence
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(__dirname, 'auth_data'),
  }),
  puppeteer: {
    args: ['--no-sandbox'],
  },
});

// Show QR code in terminal for first-time pairing
client.on('qr', (qr) => {
  console.log('\nScan this QR code with WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp bot is ready! Send a message from your phone to test.');
});

client.on('authenticated', () => {
  console.log('Authenticated successfully.');
});

client.on('auth_failure', (msg) => {
  console.error('Auth failure:', msg);
});

// Handle incoming messages
client.on('message', async (msg) => {
  // Only respond to direct messages, not groups
  if (msg.from.includes('@g.us')) return;

  // Extract phone number from sender (format: 1234567890@c.us)
  const senderPhone = msg.from.split('@')[0];

  // Only allow your phone number
  if (senderPhone !== ALLOWED_PHONE) {
    console.log(`Ignored message from unauthorized number: ${senderPhone}`);
    return;
  }

  const userMessage = msg.body.trim();
  if (!userMessage) return;

  console.log(`[${new Date().toISOString()}] Received: "${userMessage}"`);

  // Let the user know we're working on it
  await msg.reply('Running Claude Code...');

  try {
    const output = await runClaude(userMessage);
    await sendChunked(msg, output);
  } catch (err) {
    const errorMsg = err.killed
      ? 'Command timed out (2 min limit). Try a simpler request.'
      : `Error: ${err.message}`;
    await msg.reply(errorMsg);
    console.error('Command error:', err.message);
  }
});

// Run claude -p with the user's message
function runClaude(prompt) {
  return new Promise((resolve, reject) => {
    execFile(
      CLAUDE_CLI_PATH,
      ['-p', prompt],
      {
        cwd: CLAUDE_CWD,
        timeout: COMMAND_TIMEOUT_MS,
        maxBuffer: 1024 * 1024, // 1MB output buffer
        env: { ...process.env },
      },
      (error, stdout, stderr) => {
        if (error && !error.killed && stdout.length === 0) {
          return reject(error);
        }
        const result = stdout || stderr || '(no output)';
        resolve(result.trim());
      }
    );
  });
}

// Split long messages into WhatsApp-friendly chunks
async function sendChunked(msg, text) {
  const MAX_CHUNK = 4096;

  if (text.length <= MAX_CHUNK) {
    await msg.reply(text);
    return;
  }

  // Split at line boundaries when possible
  let remaining = text;
  let chunkNum = 1;

  while (remaining.length > 0) {
    let chunk;
    if (remaining.length <= MAX_CHUNK) {
      chunk = remaining;
      remaining = '';
    } else {
      // Find a good split point near the limit
      let splitAt = remaining.lastIndexOf('\n', MAX_CHUNK);
      if (splitAt < MAX_CHUNK * 0.5) splitAt = MAX_CHUNK; // no good newline, hard split
      chunk = remaining.slice(0, splitAt);
      remaining = remaining.slice(splitAt).replace(/^\n/, '');
    }

    await msg.reply(`[${chunkNum}] ${chunk}`);
    chunkNum++;
  }
}

// Start
console.log('Starting WhatsApp Claude Code bot...');
console.log(`Allowed phone: ${ALLOWED_PHONE}`);
console.log(`Claude CWD: ${CLAUDE_CWD}`);
console.log(`Claude CLI: ${CLAUDE_CLI_PATH}`);
client.initialize();