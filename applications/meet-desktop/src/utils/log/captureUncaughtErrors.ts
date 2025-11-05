import { app, dialog } from "electron";
import { c } from "ttag";
import { mainLogger } from "./index";

export function captureUncaughtErrors() {
    process.on("unhandledRejection", (reason) => {
        mainLogger.warn("unhandledRejection", reason);
    });

    process.on("uncaughtException", (reason, origin) => {
        captureTopLevelRejection(reason, origin);
    });
}

export function captureTopLevelRejection(reason: unknown, origin?: NodeJS.UncaughtExceptionOrigin) {
    mainLogger.error("uncaughtException", reason, origin);
    dialog.showErrorBox(
        c("Error dialog").t`Unexpected error`,
        c("Error dialog")
            .t`Due to an error, the app will close. Try running it again and, if the problem persists, contact us. Information about the error can be found in the application log.`,
    );
    app.exit(1);
}
