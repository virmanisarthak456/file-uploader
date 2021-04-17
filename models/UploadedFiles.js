const mongoose = require("mongoose");

const UploadedFilesSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  files: [{ type: String }],
});

const Files = mongoose.model("Files", UploadedFilesSchema);

module.exports = Files;
