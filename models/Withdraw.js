const mongoose = require('mongoose');

const WithdrawSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    details: { type: String, required: true },
    status: { type: String, default: 'pending' }, // pending, approved, rejected
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('withdraw', WithdrawSchema);