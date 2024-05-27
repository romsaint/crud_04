const NodeCache = require('node-cache')
const Posts = require('../mongoSchema/postSchema')
const Users = require('../mongoSchema/userSchema')

const { Worker } = require('worker_threads')
const os = require('os')

const cache = new NodeCache({ stdTTL: 120 })

async function homePage(req, res) {
    res.render('home')
}




async function apiPosts(req, res) {
    try {
        const postsPerPage = 5;
        const page = parseInt(req.params.page) || 0;
        const skip = page * postsPerPage;
        
        const [posts, users] = await Promise.all([
            Posts.find({}, { title: 1, body: 1, image_url: 1, user_id: 1 })
                .skip(skip)
                .limit(postsPerPage)
                .lean()
                .exec(),
            Users.find({}, { _id: 1, avatar_url: 1, name: 1 })
                .lean()
                .exec()
        ]);


        return res.json({ posts, users });
    } catch (e) {
        console.error(e);
        return res.json({
            message: "Server error",
            secondMessage: "Error.",
            color: "rgb(234, 91, 91);"
        });
    }
}

async function createPostsGet(req, res) {
    res.render('createPosts', { message: 0, secondMessage: 0, color: 0 })
}

async function createPostsPost(req, res) {
    const { title, body } = req.body
    if (!req.user) {
        return res.json({ message: "Please, auth!", secondMessage: 'Registration error', color: 'rgb(234, 91, 91);' })
    }
    if (!title || !body) {
        return res.json({ message: "Please, provide the data!", secondMessage: 'Error :(', color: 'rgb(234, 91, 91);' })
    }
    try {
        if (!req.file) {
            await Posts.create({ title, body, user_id: req.user })
            return res.json({ message: "Created without image. ", secondMessage: 'Successfully!', color: 'rgb(150, 232, 164)' })
        }

        await Posts.create({ title, body, image_url: req.file.originalname, user_id: req.user })
        return res.json({ message: "Created!", secondMessage: 'Successfully!', color: 'rgb(150, 232, 164)' })
    } catch (e) {
        return res.json({ message: e, secondMessage: 'Error :(', color: 'rgb(234, 91, 91);' })
    }
}

async function additionalInfoPost(req, res) {
    try {
        const id = req.params.post_id
        const post = await Posts.findById(id, { title: 1, body: 1, image_url: 1, user_id: 1 })
        const user = await Users.findById(post.user_id, { name: 1, avatar_url: 1 })
        res.render('additionalPost', { post, user })
    } catch (e) {
        res.render('additionalPost', { e })
    }

}

async function likePost(req, res) {
    const objectId = Object.keys(req.body)
    const id = objectId[0]
    if (!req.user) {
        return res.json({ message: "Reg", secondMessage: 'Successfully!', color: 'rgb(234, 91, 91)' })
    }
    const post = await Posts.find({ 'likes.user_id': req.user })
    if (post.length > 0) {
        return res.json({ message: "You've already liked this post", secondMessage: 'Problem', color: 'rgb(234, 91, 91)' })
    }
    await Posts.updateOne(
        { _id: id },
        {
            $push: {
                likes: {
                    user_id: req.user
                }
            }
        }
    )
    return res.json({ success: true })
}

async function removeLikePost(req, res) {
    const objectId = Object.keys(req.body)
    const id = objectId[0]

    const likedPost = await Posts.find({ _id: id })
    for (i of likedPost) {
        if (i.likes.length > 0) {
            const post = await Posts.updateOne(
                { _id: id },
                {
                    $pop: {
                        likes: {
                            user_id: req.user
                        }
                    }
                }
            )

        }
    }
}

module.exports = {
    homePage,
    createPostsGet,
    createPostsPost,
    apiPosts,
    additionalInfoPost,
    likePost
}