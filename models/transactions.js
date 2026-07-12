
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionID: {
     type: String,
     required: true, 
     unique: true
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
    }
   
  },

  status: {
    type: String,
    enum: ['PENDING', 'CLEARED', 'BLOCKED'],
    default: 'PENDING'
  }

});

module.exports = mongoose.model('Transaction', transactionSchema);
