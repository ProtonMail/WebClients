import { Rectangle, screen } from "electron";

export const ensureWindowIsVisible = (bounds: Rectangle) => {
    const nearestDisplay = screen.getDisplayMatching(bounds) || screen.getPrimaryDisplay();
    const { workArea } = nearestDisplay;

    // Ensure the window is not larger than the work area
    const safeWidth = Math.min(bounds.width, workArea.width);
    const safeHeight = Math.min(bounds.height, workArea.height);

    // Ensure the window is within the horizontal bounds of the work area
    let safeX = bounds.x;

    if (bounds.x < workArea.x) {
        safeX = workArea.x;
    } else if (bounds.x + safeWidth > workArea.x + workArea.width) {
        safeX = workArea.x + workArea.width - safeWidth;
    }

    // Ensure the window is within the vertical bounds of the work area
    let safeY = bounds.y;

    if (bounds.y < workArea.y) {
        safeY = workArea.y;
    } else if (bounds.y + safeHeight > workArea.y + workArea.height) {
        safeY = workArea.y + workArea.height - safeHeight;
    }

    return {
        x: safeX,
        y: safeY,
        width: safeWidth,
        height: safeHeight,
    };
};
