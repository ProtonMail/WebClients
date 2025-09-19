import { BrowserQRCodeReader } from '@zxing/browser';
import jsQR from 'jsqr';

const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = src;
    });

/**
 * Fallback QR code decoder using the ZXing library.
 * This is used when jsQR fails to detect a QR code — for example,
 * if the image is rotated, skewed, or low quality.
 */
const extractQrCodeFromSkewedImage = async (url: string) => {
    const img = await loadImage(url);
    const reader = new BrowserQRCodeReader();
    const result = await reader.decodeFromImageElement(img);
    return result.getText();
};

/**
 * Extracts QR code data from an image using JSQR as the primary method.
 * JSQR is significantly faster than ZXing and serves as our primary decoder.
 * ZXing is used as a fallback because it handles skewed/rotated images better,
 * though it occasionally fails on high-quality images that JSQR can read.
 */
export const extractQRCodeFromImage = async (fileData: Uint8Array<ArrayBuffer>): Promise<string> => {
    const blob = new Blob([fileData]);
    const url = URL.createObjectURL(blob);

    try {
        const img = await loadImage(url);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('Failed to get canvas context');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (!code) throw new Error('No QR code found in image');

        return code.data;
    } catch {
        return await extractQrCodeFromSkewedImage(url);
    } finally {
        URL.revokeObjectURL(url);
    }
};
