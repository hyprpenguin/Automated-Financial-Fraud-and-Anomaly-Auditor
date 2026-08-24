const mongoose = require('mongoose');

const sandboxLogSchema = new mongoose.Schema({
  scenario: { 
    type: String, 
    required: true, 
    default: 'Prompt Injection' 
  },
  endpoint: { 
    type: String, 
    required: true, 
    default: '/api/v1/security/injection' 
  },
  payload: { 
    type: String 
  },
  status: { 
    type: String, 
    default: 'Fired' 
  },
  aiScore: { 
    type: Number, 
    required: true 
  },
  resultStatus: { 
    type: String, 
    required: true 
  },
  justification: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});


module.exports = mongoose.model('SandboxLog', sandboxLogSchema);