const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true // This will create a sparse index that allows multiple null values
    },
    avatar_url: {
        type: String,
        required: false
    },
    isConfirm: {
        type: Boolean,
        required: true
    },
    randomForAuth: {
        type: String,
        required: false
    },
    complaints: [
        {
            text: {
                type: String,
                required: false
            },
            user_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Users",
                required: true
            },
            date: {
                type: Date,
                default: Date.now()
            }
        }
    ],
    date_register: {
        type: Date,
        default: Date.now(), // Corrected to use the function, not its return value
        immutable: true
    }
});



userSchema.pre('save', function(next) {
    if (this.isModified('date_register')) {
        const error = new Error('Date field is immutable');
        next(error);
    } else {
        next();
    }
});

module.exports = mongoose.model('users', userSchema);