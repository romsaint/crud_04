const multer = require('multer/')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'D:/avs_code/EXPRESS/crud_04/views/postsImage');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
});

module.exports = multer({storage: storage})