import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseConfig";

/**
 * Uploads a file to Firebase Storage in the 'lms_documents' folder.
 * 
 * @param fileUri - The local URI of the file to upload.
 * @param fileName - The name of the file.
 * @returns The public download URL of the uploaded file.
 */
export const uploadFileToFirebase = async (fileUri: string, fileName: string): Promise<string> => {
    try {
        const response = await fetch(fileUri);
        const blob = await response.blob();

        // Create a reference to 'lms_documents/fileName'
        const storageRef = ref(storage, `lms_documents/${Date.now()}_${fileName}`);

        // Infer content type if not present or generic
        let contentType = blob.type;
        if (!contentType || contentType === 'application/octet-stream') {
            const ext = fileName.split('.').pop()?.toLowerCase();
            if (ext === 'mp4') contentType = 'video/mp4';
            else if (ext === 'mov') contentType = 'video/quicktime';
            else if (ext === 'webm') contentType = 'video/webm';
            else if (ext === 'pdf') contentType = 'application/pdf';
            else if (ext === 'mp3') contentType = 'audio/mpeg';
            else if (ext === 'wav') contentType = 'audio/wav';
            else if (ext === 'm4a') contentType = 'audio/x-m4a';
        }

        const metadata = {
            contentType: contentType || 'application/octet-stream',
        };

        await uploadBytes(storageRef, blob, metadata);
        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;
    } catch (error) {
        console.error("Error uploading file to Firebase:", error);
        throw error;
    }
};
