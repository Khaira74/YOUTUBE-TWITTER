import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv"

dotenv.config({
    path: './.env'
})

// Direct credentials (working)
cloudinary.config({ 
  cloud_name: 'duzkfnvtf',
  api_key:process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_API_SECRET
});
console.log("✅ Cloudinary env vars at server start:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "MISSING",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING"
});

export const uploadCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath); // Remove temp file
    
    return result;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};
