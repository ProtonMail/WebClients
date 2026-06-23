import { app } from "electron";
import { getMainWindow } from "./view/viewManagement";
import { quitTracker } from "./log/quitTracker";

// Order matters: relaunch schedules the next process, releasing the single-instance
// lock before quit lets the new process acquire it cleanly on Linux, and hiding the
// window avoids a visible flicker between quit and relaunch.
export const restartApp = (reason: string): void => {
    app.relaunch();
    app.releaseSingleInstanceLock();
    getMainWindow()?.hide();
    quitTracker.setReason(reason);
    app.quit();
};
