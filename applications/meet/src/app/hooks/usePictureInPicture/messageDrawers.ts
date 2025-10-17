import { drawRoundedRect } from './drawingUtils';
import type { PiPOverlayMessage } from './types';

// Constants for message drawing
const messageHeight = 40;
const maxWidth = 400;

// Draw info message
export function drawInfoMessage(ctx: CanvasRenderingContext2D, msg: PiPOverlayMessage, canvasWidth: number, y: number) {
    ctx.font = 'bold 20px Arial';
    const textWidth = ctx.measureText(msg.message).width;
    const boxWidth = Math.min(textWidth + 32, maxWidth);
    const boxHeight = messageHeight;
    const boxX = (canvasWidth - boxWidth) / 2;

    // Draw toast-style background with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // Background for info message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 1;

    drawRoundedRect({ ctx, x: boxX, y, width: boxWidth, height: boxHeight, radius: 20 });
    ctx.fill();
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw info message text
    ctx.fillStyle = '#ff6b35';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(msg.message, boxX + boxWidth / 2, y + boxHeight / 2);
}

// Draw error message
export function drawErrorMessage(
    ctx: CanvasRenderingContext2D,
    msg: PiPOverlayMessage,
    canvasWidth: number,
    canvasHeight: number
) {
    ctx.font = 'bold 24px Arial';
    const textWidth = ctx.measureText(msg.message).width;
    const boxWidth = Math.min(textWidth + 40, maxWidth);
    const boxHeight = messageHeight + 10;
    const boxX = (canvasWidth - boxWidth) / 2;
    const boxY = (canvasHeight - boxHeight) / 2;

    // Draw error-style background with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    // Background for error message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;

    drawRoundedRect({ ctx, x: boxX, y: boxY, width: boxWidth, height: boxHeight, radius: 25 });
    ctx.fill();
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw error message text
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(msg.message, boxX + boxWidth / 2, boxY + boxHeight / 2);
}

// Draw chat message
export function drawChatMessage(ctx: CanvasRenderingContext2D, msg: PiPOverlayMessage, canvasWidth: number, y: number) {
    const senderText = `${msg.sender}:`;
    const fullText = `${senderText} ${msg.message}`;
    ctx.font = '18px Arial';
    const textWidth = ctx.measureText(fullText).width;
    const boxWidth = Math.min(textWidth + 85, maxWidth);
    const boxHeight = messageHeight;
    const boxX = (canvasWidth - boxWidth) / 2;

    // Draw toast-style background with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // Background for chat message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 1;

    drawRoundedRect({ ctx, x: boxX, y, width: boxWidth, height: boxHeight, radius: 20 });
    ctx.fill();
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw sender name
    ctx.fillStyle = '#4a90e2';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(senderText, boxX + 16, y + boxHeight / 2);

    // Draw message text
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    const messageX = boxX + ctx.measureText(senderText).width + 36;
    ctx.fillText(msg.message, messageX, y + boxHeight / 2);
}
