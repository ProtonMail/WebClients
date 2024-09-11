import { BrowserView, app, dialog } from "electron";
import { c } from "ttag";
import { viewLogger } from "../log";
import { CHANGE_VIEW_TARGET } from "@proton/shared/lib/desktop/desktopTypes";

const beforeUnloadChoice = () => {
    return dialog.showMessageBoxSync({
        type: "question",
        buttons: [c("Unload warning").t`Leave`, c("Unload warning").t`Stay`],
        // translator; This is used to warn users when they can loose their changes if they leave the page
        title: c("Unload warning").t`Leave page?`,
        message: c("Unload warning").t`Changes you made may not be saved.`,
        defaultId: 0,
        cancelId: 1,
    });
};

export const handleBeforeHandle = (viewID: CHANGE_VIEW_TARGET, view: BrowserView) => {
    view.webContents.on("will-prevent-unload", (ev) => {
        viewLogger(viewID).info("will-prevent-unload");
        const choice = beforeUnloadChoice();
        const leave = choice === 0;
        if (leave) {
            ev.preventDefault();
        }
    });
};

export const urlOverrideError = () => {
    const choice = dialog.showMessageBoxSync({
        type: "error",
        title: "Invalid URL override",
        message: "The URL override is invalid, please check the logs for more information.",
        buttons: ["OK"],
        defaultId: 0,
    });

    if (choice === 0) {
        app.quit();
    }
};
