import { drawChatMessage, drawErrorMessage, drawInfoMessage } from './messageDrawers';
import type { PiPOverlayMessage } from './types';

// Parameter interfaces for better readability
interface DrawRoundedRectParams {
    ctx: CanvasRenderingContext2D;
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
}

interface DrawVideoWithAspectRatioParams {
    ctx: CanvasRenderingContext2D;
    videoElement: HTMLVideoElement;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface DrawMessageOverlayParams {
    ctx: CanvasRenderingContext2D;
    canvasWidth: number;
    canvasHeight: number;
    messages: PiPOverlayMessage[];
}

// Constants for message drawing
const messageHeight = 40;

// Helper function to draw rounded rectangle
export const drawRoundedRect = ({ ctx, x, y, width, height, radius }: DrawRoundedRectParams) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
};

// Draw video with aspect ratio preservation
export const drawVideoWithAspectRatio = ({
    ctx,
    videoElement,
    x,
    y,
    width,
    height,
}: DrawVideoWithAspectRatioParams) => {
    if (videoElement.readyState >= 1 && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        try {
            const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
            const containerAspectRatio = width / height;

            let drawWidth = width;
            let drawHeight = height;
            let drawX = x;
            let drawY = y;

            if (videoAspectRatio > containerAspectRatio) {
                // Video is wider than container, fit to width
                drawHeight = width / videoAspectRatio;
                drawY = y + (height - drawHeight) / 2;
            } else {
                // Video is taller than container, fit to height
                drawWidth = height * videoAspectRatio;
                drawX = x + (width - drawWidth) / 2;
            }

            ctx.drawImage(videoElement, drawX, drawY, drawWidth, drawHeight);
        } catch (error) {
            console.warn('Failed to draw video:', error);
            // Draw error placeholder
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(x, y, width, height);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Error', x + width / 2, y + height / 2);
        }
    } else {
        // Draw placeholder if video is not ready
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let statusText = 'Loading...';
        if (videoElement.paused || videoElement.readyState < 1) {
            statusText = 'Loading...';
        } else if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            statusText = 'No video data';
        } else {
            statusText = 'Not ready';
        }
        ctx.fillText(statusText, x + width / 2, y + height / 2);
    }
};

// Draw message overlay on canvas
export const drawMessageOverlay = ({ ctx, canvasWidth, canvasHeight, messages }: DrawMessageOverlayParams) => {
    if (!messages || messages.length === 0) {
        return;
    }

    // Separate messages by type
    const infoMessages = messages.filter((msg) => msg.type === 'systemInfoMessage');
    const errorMessages = messages.filter((msg) => msg.type === 'systemErrorMessage');
    const chatMessages = messages.filter((msg) => msg.type === 'chatMessage');

    // Draw info messages at the top
    let currentY = 20;
    infoMessages.forEach((message) => {
        if (currentY + messageHeight > canvasHeight - 20) {
            return; // Don't overflow
        }

        drawInfoMessage(ctx, message, canvasWidth, currentY);
        currentY += messageHeight + 8;
    });

    // Draw error messages in the center
    errorMessages.forEach((message) => {
        drawErrorMessage(ctx, message, canvasWidth, canvasHeight);
    });

    // Draw only the latest chat message
    const latestChatMessage = chatMessages[chatMessages.length - 1];
    if (latestChatMessage && currentY + messageHeight <= canvasHeight - 20) {
        drawChatMessage(ctx, latestChatMessage, canvasWidth, currentY);
    }
};
