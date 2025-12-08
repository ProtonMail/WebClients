import { Event, Input } from "electron";
import { updateZoom } from "./viewManagement";
import { isLinux, isWindows } from "../helpers";

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
}
