import { DEFAULT_ZOOM_FACTOR, ZOOM_FACTOR_LIST, ZoomFactor } from "../../constants/zoom";
import { viewMap } from "./viewState";

export function getZoom() {
    return DEFAULT_ZOOM_FACTOR;
}

function setZoom(zoomFactor: ZoomFactor) {
    for (const view of Object.values(viewMap)) {
        view?.webContents.setZoomFactor(zoomFactor);
    }
}

export function resetZoom() {
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
