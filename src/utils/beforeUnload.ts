import { BrowserWindow, dialog } from "electron";
import log from "electron-log";

const beforeUnloadChoice = (window: BrowserWindow) => {
    return dialog.showMessageBoxSync(window, {
        type: "question",
        buttons: ["Leave", "Stay"],
        title: "Leave page?",
        message: "Changes you made may not be saved.",
        defaultId: 0,
        cancelId: 1,
    });
};

export const handleBeforeHandle = (window: BrowserWindow) => {
    window.webContents.on("will-prevent-unload", (ev) => {
        log.info("will-prevent-unload", ev);
        const choice = beforeUnloadChoice(window);
        const leave = choice === 0;
        if (leave) {
            ev.preventDefault();
        }
    });
};
