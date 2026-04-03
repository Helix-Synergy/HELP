const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Storage
// Use a function for 'params' to dynamically set resource_type
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === 'application/pdf';
    return {
      folder: 'hems_documents',
      // If it's a PDF, we treat it as 'raw' to avoid 401 transformation errors
      // If it's an image, 'image' works fine. 'auto' usually picks 'image' for PDFs.
      resource_type: isPDF ? 'raw' : 'auto', 
      public_id: `${file.fieldname}-${Date.now()}`,
      // Allowed formats for the cloud
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
    };
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

module.exports = upload;
