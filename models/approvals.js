const mongoose = require('mongoose');

let approvalSchema = new mongoose.Schema({
    electorate: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        // YYYY-MM-DD
        type: String,
        required: true
    },
    id: {
        type: Number,
        required: true
    },
    yes: {
        type: Number,
        default: 0
    },
    no: {
        type: Number,
        default: 0
    }

});

let User = mongoose.model("Approval", approvalSchema);

module.exports = Approval;