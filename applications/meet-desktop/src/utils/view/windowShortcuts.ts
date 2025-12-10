import { Event, Input, WebContentsView } from "electron";
import { getMainWindow, updateZoom } from "./viewManagement";
import { isLinux, isWindows } from "../helpers";
import { getFeatureFlagManager } from "../flags/manager";
import { FeatureFlag } from "../flags/flags";

export function handleBeforeInput(event: Event, input: Input) {
    if (input.type !== "keyDown") {
        return;
    }

    if (isWindows || isLinux) {
        // We need to listen for this shortcut manually because the `CtrlOrCmd+Plus` shortcut
        // does not work properly on Linux and Windows (it requires the Shift key too). This
        // might be removed in the future if electron fixes it.
        if (input.control && input.key === "+") {
            event.preventDefault();
            updateZoom("in");
            return;
        }
    }

    if (getFeatureFlagManager().isEnabled(FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED)) {
        if (input.control && input.alt && input.shift && input.code === "KeyI") {
            const mainWindow = getMainWindow();
            // We need to force WebContentsView type here because getContentView() has a type bug.
            const view = mainWindow.getContentView() as unknown as WebContentsView;

            if (view) {
                view.webContents.toggleDevTools();
            } else {
                mainWindow.webContents.toggleDevTools();
            }
        }
    }
}
