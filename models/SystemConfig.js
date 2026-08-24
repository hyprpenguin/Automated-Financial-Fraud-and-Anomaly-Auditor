// models/SystemConfig.js
const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  apiKey: { type: String, default: 'Sentinel_SK_a1b2c3d4e5f6g7h8' },
  apiKeyLastUsed: { type: Date, default: Date.now },
  webhookUrl: { type: String, default: 'https://sentinel.webhook.site/alerts' },
  webhookStatus: { type: String, default: 'Active' },
  slackConnected: { type: Boolean, default: true }
});

module.exports = mongoose.model('SystemConfig', configSchema);