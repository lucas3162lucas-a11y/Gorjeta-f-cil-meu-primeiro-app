const path = require('node:path');
const fs = require('node:fs');

const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const env = (name, fallback = '') => process.env[name] ?? fallback;

module.exports = {
  port: Number(env('PORT', 3000)),
  publicUrl: env('PUBLIC_URL', 'http://localhost:3000').replace(/\/$/, ''),
  appName: env('APP_NAME', 'ZapVendas IA'),
  sessionSecret: env('SESSION_SECRET', 'dev-secret'),
  adminEmail: env('ADMIN_EMAIL').toLowerCase(),
  dataDir: path.join(__dirname, '..', 'data'),

  nvidia: {
    apiKey: env('NVIDIA_API_KEY'),
    baseUrl: env('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1'),
    models: {
      simple: env('NVIDIA_MODEL_SIMPLE', 'nvidia/nemotron-3.5-lightning-30b-a3b'),
      plus: env('NVIDIA_MODEL_PLUS', 'nvidia/nemotron-3-super-120b-a12b'),
      pro: env('NVIDIA_MODEL_PRO', 'nvidia/nemotron-3-ultra-550b-a55b'),
    },
    // Usado se o modelo do plano for desativado pela NVIDIA ou estiver fora do ar
    fallbackModel: env('NVIDIA_MODEL_FALLBACK', 'openai/gpt-oss-20b'),
  },

  cakto: {
    checkout: {
      simple: env('CAKTO_CHECKOUT_SIMPLE'),
      plus: env('CAKTO_CHECKOUT_PLUS'),
      pro: env('CAKTO_CHECKOUT_PRO'),
    },
    webhookSecret: env('CAKTO_WEBHOOK_SECRET'),
  },

  graceDays: Number(env('GRACE_DAYS', 2)),
};
