import {v2 as cloudinary} from "cloudinary";
import fs from "fs"

 // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.CLOUD_API_KEY, 
        api_secret: process.env.CLOUD_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadFile = async(filePath) => {
        try{
            if(!filePath)return null;
            const response = await cloudinary.uploader.upload(filePath,{resource_type:"auto"});
            console.log(`File uploaded successfully. URL: ${response.url}`);
            return response
        }
        catch(error){
            fs.unlinkSync(filePath);
            console.error("Error uploading file to Cloudinary:", error);
            throw error;

        }

    }

    export default uploadFile;
