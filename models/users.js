const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
    userid: {
        type: Number,
        required: true,
        unique: true
    },
    postcode: {
        type: Number,
        required: true
    }
});

let User = mongoose.model("User", userSchema);

module.exports = User;