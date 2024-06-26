import { Rectangle, screen } from "electron";

export const ensureWindowIsVisible = (bounds: Rectangle) => {
    const { width, height, x, y } = bounds;
    const nearestDisplay = screen.getDisplayMatching(bounds) || screen.getPrimaryDisplay();
    const { workArea } = nearestDisplay;

    // Ensure the window is not larger than the work area
    const safeWidth = Math.min(width, workArea.width);
    const safeHeight = Math.min(height, workArea.height);

    // Ensure the window is within the horizontal bounds of the work area
    let safeX = x;
    if (x < workArea.x || x > workArea.x + workArea.width) {
        safeX = workArea.x;
    }

    // Ensure the window is within the vertical bounds of the work area
    let safeY = y;
    if (y < workArea.y || y > workArea.y + workArea.height) {
        safeY = workArea.y;
    }

    return { x: safeX, y: safeY, width: safeWidth, height: safeHeight };
};
