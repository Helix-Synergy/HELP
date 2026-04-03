const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // We use 'auto' which is most compatible, 
    // but ensure we don't force image transformations
    return {
      folder: 'hems_documents',
      public_id: `${file.fieldname}-${Date.now()}`, // Cloudinary adds the correct extension
      resource_type: 'auto',
      flags: 'attachment' // Force download behavior
    };
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

module.exports = upload;
