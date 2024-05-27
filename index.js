require('dotenv').config()
const path = require('path')
const express = require('express')
const app = express()
const compression = require('compression')
const rateLimit = require('express-rate-limit');
const sanitize = require('express-sanitizer');

const os = require('os')
//const helmet = require('helmet')
const router = require('./routers/userRouter')

app.set('view engine', 'ejs')


app.use(sanitize());
app.use(compression())
app.use(express.static(path.join(__dirname, 'views')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(router)


app.listen(5021)
