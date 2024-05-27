const mongoose = require('mongoose')

const postsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    image_url: {
        type: String,
        required: false
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    likes: [
        {
            user_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Users",
                required: true
            }
        }
    ],
    date_created: {
        type: Date,
        default: () => Date.now(),
        immutable: true
    }
})

postsSchema.index('user_id')

postsSchema.pre('save', function(next) {
    if (this.isModified('date_created')) {
        const error = new Error('Date field is immutable');
        next(error);
    } else {
        next();
    }
});

module.exports = mongoose.model('posts', postsSchema)