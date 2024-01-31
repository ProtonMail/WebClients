import { BrowserWindow, dialog } from "electron";
import log from "electron-log";
import { c } from "ttag";

const beforeUnloadChoice = (window: BrowserWindow) => {
    return dialog.showMessageBoxSync(window, {
        type: "question",
        buttons: [c("Unload warning").t`Leave`, c("Unload warning").t`Stay`],
        // translator; This is used to warn users when they can loose their changes if they leave the page
        title: c("Unload warning").t`Leave page?`,
        message: c("Unload warning").t`Changes you made may not be saved.`,
        defaultId: 0,
        cancelId: 1,
    });
};

export const handleBeforeHandle = (window: BrowserWindow) => {
    window.webContents.on("will-prevent-unload", (ev) => {
        log.info("will-prevent-unload");
        const choice = beforeUnloadChoice(window);
        const leave = choice === 0;
        if (leave) {
            ev.preventDefault();
        }
    });
};
