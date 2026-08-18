const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    default: 'New User'
   }, 
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  phone: { type: String, 
    default: '+1 (000) 000-0000' 
  }, 
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    default: 'Auditor' 
  },
  status: { type: String, 
    default: 'Active' 
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = mongoose.model('User', userSchema);