import multer from "multer";




// storing  inthe disk
const storage = multer.diskStorage({


  destination: function (req, file, cb) {// to uplad file we multer otherwisre json data can be stored dirlcyt in mongodb
    cb(null, './public/temp')
    // cb=callback
// Because Multer might process files asynchronously, and Node.js uses the error-first callback style for async functions.
// Using cb(error, result) lets Multer:
// Stop immediately if there’s an error
// Continue only when you’ve given the result
  },
  // name of file to be uploaded
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

// Multer receives file metadata.

// Calls your destination() function:

// You decide the folder.

// You call cb(null, folderPath).

// Calls your filename() function:

// You decide the saved filename.

// You call cb(null, filename).

// Multer writes the file to disk.
export const upload = multer({ storage: storage })