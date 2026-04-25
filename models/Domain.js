// models/Domain.js
const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema({
    url: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        default: 'active' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Domain', domainSchema);