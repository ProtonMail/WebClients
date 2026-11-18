import { DEFAULT_ZOOM_FACTOR, ZOOM_FACTOR_LIST, ZoomFactor } from "../../constants/zoom";
import { getWindowBounds, saveWindowBounds } from "../../store/boundsStore";
import { mainLogger } from "../log";
import { getMainWindowOrNull, viewMap } from "./viewState";

export function getZoom() {
    const zoomFactor = getWindowBounds().zoom;

    if (ZOOM_FACTOR_LIST.includes(zoomFactor)) {
        return zoomFactor;
    }

    return DEFAULT_ZOOM_FACTOR;
}

function setZoom(zoomFactor: ZoomFactor) {
    mainLogger.info("set zoom factor to", zoomFactor);

    for (const view of Object.values(viewMap)) {
        view?.webContents.setZoomFactor(zoomFactor);
    }

    const mainWindow = getMainWindowOrNull();
    if (mainWindow) {
        saveWindowBounds(mainWindow, {
            zoom: zoomFactor,
        });
    }
}

export function resetZoom() {
    mainLogger.info("reset zoom");
    setZoom(DEFAULT_ZOOM_FACTOR);
}

export function updateZoom(direction: "in" | "out") {
    const zoomFactorIndex = ZOOM_FACTOR_LIST.indexOf(getZoom());

    const nextZoomFactor =
        direction === "in"
            ? ZOOM_FACTOR_LIST[Math.min(ZOOM_FACTOR_LIST.length - 1, zoomFactorIndex + 1)]
            : ZOOM_FACTOR_LIST[Math.max(0, zoomFactorIndex - 1)];

    setZoom(nextZoomFactor);
}
