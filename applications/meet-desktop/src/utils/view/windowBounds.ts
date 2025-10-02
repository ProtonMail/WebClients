import { Rectangle, screen } from "electron";

function safeCoordinate(
    [workAreaPosition, workAreaSize]: [number, number],
    [windowPosition, windowSize]: [number, number],
) {
    const safeSize = Math.min(workAreaSize, windowSize);
    let safePosition = windowPosition;

    if (windowPosition < workAreaPosition) {
        safePosition = workAreaPosition;
    } else if (windowPosition + windowSize > workAreaPosition + workAreaSize) {
        safePosition = workAreaPosition + workAreaSize - safeSize;
    }

    return [safePosition, safeSize];
}

export const ensureWindowIsVisible = (bounds: Rectangle) => {
    const { workArea } = screen.getDisplayMatching(bounds) || screen.getPrimaryDisplay();

    // Ensure the window is not larger than the work area
    const [safeX, safeWidth] = safeCoordinate([workArea.x, workArea.width], [bounds.x, bounds.width]);
    const [safeY, safeHeight] = safeCoordinate([workArea.y, workArea.height], [bounds.y, bounds.height]);

    return {
        x: safeX,
        y: safeY,
        width: safeWidth,
        height: safeHeight,
    };
};
