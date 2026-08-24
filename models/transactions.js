const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionID: {
     type: String,
     required: true, 
     unique: true
  },
  userId: { 
    type: String,
    required: true
  },
  merchant: { 
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  aiRiskAssessment: {
    riskScore: {
      type: Number,
      min: 0,
      max: 100
    },
    isMalicious: {
      type: Boolean,
      default: false
    },
    justification: {
      type: String,
      default: null
    },
    patternFlag: { 
      type: String,
      default: "None"
    }
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'FLAGGED', 'APPROVED'],
    default: 'PENDING'
  }
}, { timestamps: true }); 

module.exports = mongoose.model('Transactions', transactionSchema);