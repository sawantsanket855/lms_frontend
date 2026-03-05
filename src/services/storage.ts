import { Platform } from 'react-native';
import api from "./api";

/**
 * Uploads a file to the backend PostgreSQL storage.
 * 
 * @param fileUri - The local URI of the file to upload.
 * @param fileName - The name of the file.
 * @returns The ID of the stored media file.
 */
export const uploadFile = async (fileUri: string, fileName: string): Promise<string> => {
    try {
        const formData = new FormData();

        // In React Native, the file object in FormData needs special handling
        // We use the file extension to determine the mime type
        const extension = fileName.split('.').pop()?.toLowerCase();
        let type = 'application/octet-stream';

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
            type = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
        } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension || '')) {
            type = `video/${extension === 'mov' ? 'quicktime' : extension}`;
        } else if (extension === 'pdf') {
            type = 'application/pdf';
        } else if (['mp3', 'wav', 'm4a'].includes(extension || '')) {
            type = `audio/${extension === 'm4a' ? 'mp4' : extension}`;
        }

        // @ts-ignore - FormData expects Blobs but React Native uses this object format
        formData.append('file', {
            uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
            name: fileName,
            type: type
        } as any);

        const response = await api.post('/media/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            // Add onUploadProgress if needed for UI feedback
        });

        return response.data.id;
    } catch (error) {
        console.error("Error uploading file to Backend:", error);
        throw error;
    }
};
