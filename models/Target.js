const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['Transaction', 'Sandbox', 'Database', 'Auth', 'API'] 
  },
  endpointUrl: { 
    type: String, 
    required: true 
  },
  parameters: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Target', targetSchema);