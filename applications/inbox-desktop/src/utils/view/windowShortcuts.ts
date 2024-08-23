import { Event, Input } from "electron";
import { updateZoom } from "./viewManagement";
import { isLinux, isWindows } from "../helpers";

export function handleBeforeInput(event: Event, input: Input) {
    // We need to listen for this shortcut manually because the `CtrlOrCmd+Plus` shortcut
    // does not work properly on Linux and Windows (it requires the Shift key too). This
    // might be removed in the future if electron fixes it.
    if (isWindows || isLinux) {
        if (input.type === "keyDown" && input.control && input.key === "+") {
            event.preventDefault();
            updateZoom("in");
            return;
        }
    }
}
