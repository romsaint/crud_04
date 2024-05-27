const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const lodash = require('lodash')
const nodemailer = require('nodemailer')
const wellknown = require('nodemailer-wellknown')
const validator = require('validator')
const NodeCache = require('node-cache')
const path = require('path')
const { ObjectId } = require('mongodb')
const Users = require('../mongoSchema/userSchema')
const Posts = require('../mongoSchema/postSchema')
const complaintDiagram = require('../controllers/complaintDiagramController')

const cache = new NodeCache({ stdTTL: 120 })


let transporter;
transporter = nodemailer.createTransport({
    secure: true,
    host: 'smtp.mail.ru',
    port: 465,
    auth: {
        user: process.env.MAIL_FOR_SEND,
        pass: process.env.PASS_FOR_SEND

    }
})

async function registrationPage(req, res) {
    res.render('reg', { message: 0, secondMessage: 0, color: 0, token: 0, email: 0 })
}

async function registrationPost(req, res) {
    const { name, password, remember, email } = req.body;

    const isPassword = validator.isStrongPassword(password)

    if (email) {
        if (!email.endsWith('ru') && !email.endsWith('com')) {
            return res.json({ message: "The email is unreliable", secondMessage: 'Email error :(', color: 'rgb(234, 91, 91);' });
        }
        if (email.endsWith('com')) {
            transporter = nodemailer.createTransport(wellknown('gmail'), {
                auth: {
                    user: process.env.PASS_FOR_GMAIL,
                    pass: process.env.GMAIL_FOR_SEND
                }
            });
        }

        const isEmail = validator.isEmail(email)
        if (!isEmail) {
            return res.json({ message: "The email is unreliable", secondMessage: 'Email error :(', color: 'rgb(234, 91, 91);' });
        }
        const isEmailUsed = await Users.findOne({ email: email }, 'email -_id').lean()

        if (isEmailUsed) {
            return res.json({ message: "Email is already used", secondMessage: 'Error :(', color: 'rgb(234, 91, 91);' });
        }
    }

    // if(!isPassword ){
    //     return res.json({ message: "The password is unreliable", secondMessage: 'Password error :(', color: 'rgb(234, 91, 91);'});
    // }

    if (!name || !password) {
        return res.json({ message: "Please, fill all fields", secondMessage: 'Error :(', color: 'rgb(234, 91, 91);' });
    }


    let isUserExists = await Users.findOne({ name: name }, 'name -_id').lean()

    if (isUserExists) {
        return res.json({ message: "User already exists!", secondMessage: 'Try again :(', color: '#f0e27c;' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        let avatarUrl = null;
        if (req.file) {
            avatarUrl = req.file.originalname;
            const ext = path.extname(avatarUrl);
            if (ext !== '.jpeg' && ext !== '.png' && ext !== '.jpg' && ext !== '.svg') {
                return res.json({ message: "Please select the correct image file", secondMessage: 'Image error', color: '#f0e27c;' });
            }
        }


        const randomForAuth = Math.floor(Math.random() * 9000) + 1000;
        const hashedrandomForAuth = await bcrypt.hash(randomForAuth.toString(), 10)

        let savedUser;

        if (email) {
            savedUser = await Users.create({
                name,
                password: hashedPassword,
                avatar_url: avatarUrl,
                email,
                isConfirm: false,
                randomForAuth: hashedrandomForAuth
            });
        } else {
            savedUser = await Users.create({
                name,
                password: hashedPassword,
                avatar_url: avatarUrl,
                isConfirm: true
            });
        }

        if (email) {
            const mailOptions = {
                from: {
                    name: 'My site',
                    address: 'roma.ggg.20@list.ru'
                },
                to: email,
                subject: "Confirm verifications",
                text: `Copy and paste that: ${randomForAuth}`,
                html: `<center><h1>${randomForAuth}</h1></center>`
            }
            transporter.sendMail(mailOptions, (e, info) => {
                if (e) {
                    return res.json({ message: e.message, secondMessage: 'Error :(asd', color: 'rgb(234, 91, 91);' });
                }
            })
        }
        if (email !== '') {
            if (remember) {
                const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET);
                return res.json({ message: "Confirm the data from the email", secondMessage: 'Comfort', color: 'rgb(150, 186, 232)', token, email });
            } else {
                const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
                return res.json({ message: "Confirm the data from the email", secondMessage: 'Comfort', color: 'rgb(150, 186, 232)', token, email });
            }
        } else {
            if (remember) {
                const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET);
                return res.json({ message: "Successfully registered!", secondMessage: 'Comfort', color: 'rgb(150, 232, 164)', token, email });
            } else {
                const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
                return res.json({ message: "Successfully registered!", secondMessage: 'Comfort', color: 'rgb(150, 232, 164)', token, email });
            }
        }

    } catch (e) {
        console.log(e)
        return res.json({ message: e.message, secondMessage: 'Server error.', color: 'rgb(234, 91, 91);' });
    }
}
async function verifyEmail(req, res) {
    const { inputVerification1, inputVerification2, inputVerification3, inputVerification4 } = req.body

    if (!req.user) {
        return res.json({ message: 'Please, authenticate.', secondMessage: 'Try again!', color: 'rgb(234, 91, 91);' });
    }
    if (!inputVerification1 || !inputVerification2 || !inputVerification3 || !inputVerification4) {
        return res.json({ message: 'Provide the data', secondMessage: 'Data error', color: 'rgb(234, 91, 91);' });
    }
    const user = await Users.findById({ _id: req.user }, 'randomForAuth -_id').lean()
    const verifyNumbers = inputVerification1 + inputVerification2 + inputVerification3 + inputVerification4
    const isVerifyTrue = await bcrypt.compare(verifyNumbers, user.randomForAuth)

    if (!isVerifyTrue) {
        return res.json({ message: 'Not match!', secondMessage: 'Email verification error.', color: 'rgb(234, 91, 91);' });
    }

    await Users.updateOne(
        { _id: req.user },
        {
            $set: {
                isConfirm: true
            }
        }
    )
    return res.json({ message: "Successfully registered!", secondMessage: 'Comfort', color: 'rgb(150, 232, 164)' });
}


async function loginPage(req, res) {
    res.render('login')
}
async function loginPost(req, res) {
    const { name, password } = req.body
    if (!name || !password) {
        return res.json({ message: "Please, fill all fields!", secondMessage: 'Error :(', color: 'rgb(234, 91, 91);' });
    }
    try {
        const userExists = await Users.findOne({ name: name }, { password: 1 }).lean()

        if (!userExists) {
            return res.json({ message: "User not found.", secondMessage: 'Try again :(', color: '#f0e27c;' });
        }
        const passwordTrue = await bcrypt.compare(password, userExists.password)
        if (!passwordTrue) {
            return res.json({ message: "Passwords don't match.", secondMessage: 'Try again :(', color: '#f0e27c;' });
        }

        const token = jwt.sign({ userId: userExists._id }, process.env.JWT_SECRET);

        return res.json({ message: "Successfully logining!", secondMessage: 'Comfort', color: 'rgb(150, 232, 164)', token });
    } catch (e) {
        return res.json({ message: e.message, secondMessage: 'Error :(', color: 'rgb(234, 91, 91);' });
    }
}

async function logout(req, res) {
    try {
        req.user = null
        return res.json({ message: "Successfully logout!", secondMessage: 'Nice!', color: 'rgb(150, 232, 164)' });
    } catch (e) {
        return res.json({ message: e.message, secondMessage: 'Error :(', color: 'rgb(234, 91, 91);' });
    }
}

async function verifyToken(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        return res.json({ message: "Please, register!", secondMessage: 'Registration error.', color: '#f0e27c;' });
    }
    const token = header.split(' ')[1];
    if (!token) {
        return res.json({ message: "Please, register!", secondMessage: 'Registration error.', color: '#f0e27c;' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.json({ message: 'Please, authenticate.', secondMessage: 'Try again!', color: 'rgb(234, 91, 91);' });
        }
        req.user = decoded.userId;
        next();
    });
}

async function profilePage(req, res) {
    res.render('profile');
}
async function profileData(req, res) {
    if (!cache.get('postsCache') || !cache.get('usersCache') || !cache.get('complaintsByDayCache') || !cache.get('userCache')) {
        try {
            const user = await Users.findById(req.user).limit(20).lean()

            let complaintsByDay = await complaintDiagram(user)

            if (!user) {
                return res.json({ message: 'Please, authenticate', secondMessage: 'Error :(', color: 'rgb(234, 91, 91);' });
            }
            if (!user.isConfirm) {
                return res.json({ message: 'Please, confirm your email', secondMessage: 'Error :(', color: 'rgb(234, 91, 91);' });
            }

            const posts = await Posts.find({ user_id: user._id }, { title: 1, body: 1, date_created: 1 }).limit(20).lean().exec()
            const users = await Users.find({ _id: { $ne: req.user } }, { name: 1 }).limit(20).lean().exec()

            
            cache.set('postsCache', posts)
            cache.set('usersCache', users)
            cache.set('complaintsByDayCache', complaintsByDay)
            cache.set('userCache', user)


            res.json({ user, posts, users, complaintsByDay });
        } catch (e) {
            res.json({ message: e.message, secondMessage: 'Error :(', color: 'rgb(234, 91, 91);' });
        }
    } else {
        res.json({ user: cache.get('userCache'), posts: cache.get('postsCache'), users: cache.get('usersCache'), complaintsByDay: cache.get('complaintsByDayCache') });
    }
}

async function anotherProfile(req, res) {
    const id = req.params.user_id

    res.render('anotherProfile', { id })
}
async function anotherProfileData(req, res) {
    const id = req.params.user_id

    try {
        const user = await Users.findById(id).lean()

        let complaintsByDay = await complaintDiagram(user)


        const posts = await Posts.find({ user_id: user._id }, { title: 1, body: 1, date_created: 1 }).limit(20).lean().exec()
        const users = await Users.find({ _id: { $ne: req.user } }, { name: 1 }).limit(20).lean().exec()

        res.json({ user, posts, users, complaintsByDay });
    } catch (e) {
        res.json({ message: e.message, secondMessage: 'Error :(', color: 'rgb(234, 91, 91);' });
    }
}

async function complaintUser(req, res) {
    const { complaint } = req.body;
    const userIdToComplain = req.params.user_id;
    const currentUserId = req.user
    if (userIdToComplain === req.user) {
        return res.json({ message: 'You cannot file a complaint against yourself', secondMessage: 'Denied :(', color: 'rgb(234, 91, 91);' });
    }
    try {
        if (!userIdToComplain) {
            return res.json({ message: 'User ID to complain is required.' });
        }
        const user = await Users.findById(userIdToComplain, { complaints: 1 }).lean()
        if (user.complaints.length === 0) {
            const newComplaint = {
                text: complaint[1],
                count: 1,
                user_id: currentUserId,
                date: new Date()
            };

            await Users.updateOne(
                { _id: userIdToComplain },
                { $push: { complaints: newComplaint } }
            );
        } else {
            for (value of user.complaints) {
                const currentUserObjectId = new ObjectId(req.user)
                if (currentUserObjectId.equals(value.user_id)) {
                    return res.json({ message: 'You have already filed a complaint', secondMessage: ':(', color: '#f0e27c;' });
                }
            }

            const newComplaint = {
                text: complaint[1],
                user_id: currentUserId,
                date: new Date()
            };


            await Users.updateOne(
                { _id: userIdToComplain },
                { $push: { complaints: newComplaint } }
            );
        }

        return res.json({ message: "Complaint has been submitted.", secondMessage: 'Comfort', color: 'rgb(150, 232, 164)' });
    } catch (e) {
        console.log(e)
        res.json({ message: e.message, secondMessage: 'Error :(', color: 'rgb(234, 91, 91);' });
    }
}

async function complaintDiagramGet(req, res) {
    res.render('complaintDiagram')
}

async function complaintDiagramData(req, res) {
    const id = req.user
    if (!id) {
        return res.json({ message: "Please, register!", secondMessage: 'Registration error.', color: '#f0e27c;' });
    }
    const user = await Users.findById(req.user).lean()
    let complaintsByDay = await complaintDiagram(user)

    res.json({ user, complaintsByDay });
}




module.exports = {
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
}



// console.log((48 + 69 + 47 + 45 + 29) / 5)