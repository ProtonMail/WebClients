import { app } from "electron";
import Logger from "electron-log";

export function handleSquirrelEvents() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const squirrelStartup = require("electron-squirrel-startup");

    if (squirrelStartup) {
        Logger.info("App is squirrel: ", squirrelStartup);
        app.quit();
    }
}
