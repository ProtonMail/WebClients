import { getParticipantInitials } from '../../utils/getParticipantInitials';

// Type that accepts both regular and offscreen canvas contexts
type CanvasContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function roundRect(ctx: CanvasContext, x: number, y: number, width: number, height: number, radius: number) {
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
}

export function drawParticipantName({
    ctx,
    name,
    x,
    y,
    height,
}: {
    ctx: CanvasContext;
    name: string;
    x: number;
    y: number;
    height: number;
}) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 16px InterVariable, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';

    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Draw text at bottom-left corner (10px padding from left and bottom)
    ctx.fillText(name, x + 32, y + height - 16);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

export const PROFILE_COLORS = [
    '#b9abff', // purple
    '#88f189', // green
    '#ababf8', // blue-ish
    '#7bdcff', // cyan
    '#ff8a8a', // red
    '#ffb35f', // orange
];

const MEET_BACKGROUND_COLORS = [
    '#413969', // purple-minor-3
    '#2b3e40', // green-minor-3
    '#332f62', // interaction-minor-3
    '#094a62', // blue-minor-3
    '#3d2a3d', // red-minor-2
    '#523a2e', // orange-minor-3
];

export function drawParticipantPlaceholder({
    ctx,
    name,
    x,
    y,
    width,
    height,
    colorIndex,
    radius = 12,
}: {
    ctx: CanvasContext;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    radius?: number;
    colorIndex: number;
}) {
    // Save context
    ctx.save();

    // Create rounded rectangle clipping path
    roundRect(ctx, x, y, width, height, radius);
    ctx.clip();

    const bgColor = MEET_BACKGROUND_COLORS[colorIndex % MEET_BACKGROUND_COLORS.length];

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, width, height);

    // Parse profile color index
    const profileColor = PROFILE_COLORS[colorIndex % PROFILE_COLORS.length];

    // Calculate circle size based on tile size (proportional to view size)
    const circleSize = Math.min(width, height) * 0.3; // 30% of smallest dimension
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Draw profile circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = profileColor;
    ctx.fill();

    // Draw initials
    const initials = getParticipantInitials(name);
    const fontSize = circleSize * 0.4;
    ctx.fillStyle = '#000000';
    ctx.font = `600 ${fontSize}px InterVariable, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    // Measure text to calculate proper vertical centering
    const metrics = ctx.measureText(initials);
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    const textY = centerY + textHeight / 2 - metrics.actualBoundingBoxDescent;
    ctx.fillText(initials, centerX, textY);

    // Restore context
    ctx.restore();
}

export function drawParticipantBorder({
    ctx,
    x,
    y,
    width,
    height,
    colorIndex,
    isActive,
    radius = 12,
}: {
    ctx: CanvasContext;
    x: number;
    y: number;
    width: number;
    height: number;
    colorIndex: number;
    isActive: boolean;
    radius?: number;
}) {
    if (!isActive) {
        return;
    }

    const color = PROFILE_COLORS[colorIndex % PROFILE_COLORS.length];
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    // Draw rounded rectangle border
    roundRect(ctx, x, y, width, height, radius);
    ctx.stroke();
}
