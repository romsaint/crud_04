require('dotenv').config()
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const upload = require('../controllers/multerPostController')
const uploadUser = require('../controllers/multerUserController')

const {
    verifyToken,
    registrationPage,
    registrationPost,
    loginPage,
    loginPost,
    profilePage,
    profileData,
    anotherProfile,
    anotherProfileData,
    complaintUser,
    logout,
    complaintDiagramGet,
    complaintDiagramData,
    verifyEmail
} = require('../controllers/userController')
const {
    homePage,
    createPostsGet,
    createPostsPost,
    apiPosts,
    additionalInfoPost,
    likePost
} = require('../controllers/postController')

async function connectMongoose() {
    await this.connect('mongodb://localhost/crud_04')
}
connectMongoose.call(mongoose)
//         HOME        //
router.get('/', homePage)
router.get('/posts/:page', apiPosts)
//        POSTS        //
router.get('/create-post', createPostsGet)
router.post('/create-post', verifyToken, upload.single('image'), createPostsPost)
router.get('/additional-info-post/:post_id', additionalInfoPost)
//        REGISTRATION       //
router.get('/reg', registrationPage)
router.post('/reg',
    uploadUser.single('avatar'), 
    registrationPost
);
//       MAIL REGISTRATION       //
router.post('/verify-email', verifyToken, verifyEmail)
//        LOGIN          //
router.get('/login', loginPage)
router.post('/login', loginPost)
//       LOGOUT         //
router.post('/logout', logout)
//      PROFILE          //
router.get('/profile', profilePage)
router.get('/profile-data', verifyToken, profileData)

router.get('/profile/:user_id', anotherProfile)
router.get('/profile-data/:user_id', verifyToken,anotherProfileData)
//      COMPLAINT       //
router.post('/complaints/:user_id', verifyToken, complaintUser)

router.get('/complaint-diagram', complaintDiagramGet)
// router.post('/complaint-diagram-data', verifyToken, complaintDiagramData)
//     LIKE        //
router.post('/like-post', verifyToken, likePost)


module.exports = router