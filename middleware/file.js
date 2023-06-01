const multer = require("multer");
const path = require("path");
const fs = require("fs");

exports.upload = function (dest) {
  const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      fs.mkdirSync(path.join(__dirname, "../public/" + dest), {
        recursive: true,
      });
      cb(null, path.join(__dirname, "../public/" + dest));
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
  });
  var upload = multer({ storage: diskStorage });
  return upload;
};
