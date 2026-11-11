// Matches the `CircleLoader` atom: a 16-unit viewBox with an r=7 circle, a 2-unit stroke and a
// dash covering 60% of the circumference that turns once per second.
const LOADER_RADIUS_RATIO = 7 / 16;
const LOADER_STROKE_RATIO = 2 / 16;
const LOADER_ARC_RATIO = 0.6;
const LOADER_TRACK_OPACITY = 0.2;
const LOADER_REVOLUTION_MS = 1000;

const LOADER_SIZE_TO_SHORTER_EDGE = 0.12;

export const LOADING_FRAMES_PER_SECOND = 15;

export const drawLoadingFrame = (
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
    elapsedMs: number,
    color: string
) => {
    context.globalAlpha = 1;
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    const loaderSize = Math.min(width, height) * LOADER_SIZE_TO_SHORTER_EDGE;
    const radius = loaderSize * LOADER_RADIUS_RATIO;
    const centerX = width / 2;
    const centerY = height / 2;
    context.lineWidth = loaderSize * LOADER_STROKE_RATIO;
    context.lineCap = 'round';
    context.strokeStyle = color;

    context.globalAlpha = LOADER_TRACK_OPACITY;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.stroke();

    context.globalAlpha = 1;
    const startAngle = ((elapsedMs % LOADER_REVOLUTION_MS) / LOADER_REVOLUTION_MS) * 2 * Math.PI;
    context.beginPath();
    context.arc(centerX, centerY, radius, startAngle, startAngle + LOADER_ARC_RATIO * 2 * Math.PI);
    context.stroke();
};
