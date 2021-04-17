const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("connect-flash");
const session = require("express-session");
var CronJob = require("cron").CronJob;
const nodemailer = require("nodemailer");
let cookieParser = require("cookie-parser");
const Files = require("./models/UploadedFiles");

const app = express();
app.use(cookieParser());

// Passport Config
require("./config/passport")(passport);
const db = require("./config/mongoose");
const multer = require("multer");
const path = require("path");
const User = require("./models/User");
// EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var upload = multer({ storage: storage });

var uploadMultiple = upload.fields([
  { name: "file1", maxCount: 10 },
  { name: "file2", maxCount: 10 },
]);

// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// Routes
app.use("/", require("./routes/index.js"));
app.use("/users", require("./routes/users.js"));
app.post("/uploadfile", uploadMultiple, function (req, res, next) {
  const userId = req.cookies["userData"];
  const files = [
    req.files.file1[0].originalname,
    req.files.file2[0].originalname,
  ];

  console.log(files);
  Files.insertMany({
    email: userId,
    files: files,
  });
  if (req.files) {
    console.log(req.files);
    res.redirect("back");
  }
});

var job = new CronJob(
  "0 */2 * * * *",
  async function () {
    console.log("Cron run every two hours");

    let transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "XYZ@gmail.com", //TODO add your email and pass
        pass: "****",
      },
    });

    const message = {
      from: "XYZ@gmail.com", // TODO add your email ,Sender address
      subject: "Files are uploaded", // Subject line
    };

    const users = await User.find({});
    users.forEach(async (user) => {
      const email = user.email;
      message.to = email;
      message.attachments = [];
      const files = await Files.find({ email: email });
      files.forEach((file) => {
        message.attachments.push({ filename: file.files[0] });
        message.attachments.push({ filename: file.files[1] });
      });
      transport.sendMail(message, function (err, info) {
        if (err) {
          console.log("err", err);
        } else {
          console.log("success");
        }
      });
    });
  },
  null,
  true,
  "America/Los_Angeles"
);

job.start();

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on  ${PORT}`));
