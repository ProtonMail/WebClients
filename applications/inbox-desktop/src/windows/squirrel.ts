import { app } from "electron";
import { spawn } from "node:child_process";
import { appendFileSync, copyFileSync, existsSync, openSync } from "node:fs";
import { resolve } from "node:path";
import { installProtocols, updateProtocols, uninstallProtocols } from "../utils/protocol/setup";

import {
    SQUIRREL_INSTALL,
    SQUIRREL_UPDATED,
    SQUIRREL_UNINSTALL,
    SQUIRREL_OBSOLETE,
    isSquirrelStartup,
    handleInstallShortcuts,
    handleUpdatedShortcuts,
    handleUninstallShortcuts,
    squirrelLogger,
    parseInstallArguments,
} from "@proton/shared/lib/squirrel/squirrel";
import { setInstallSource } from "../store/installInfoStore";

async function spawnUninstallProcess() {
    const uninstallLogPath = resolve(app.getPath("temp"), "proton-mail-uninstall.log");
    const uninstallLogFileDescriptor = openSync(uninstallLogPath, "a");

    const log = (...data: unknown[]) => {
        const prefix = existsSync(uninstallScriptTempPath) ? "\n" : "";
        const date = new Date().toISOString();
        const message = data
            .join(" ")
            .split("\n")
            .filter((line) => line.trim().length)
            .map((chunk) => `[${date}] ${chunk}`)
            .join("\n");

        appendFileSync(uninstallLogPath, `${prefix}${message}`, "utf8");
    };

    const uninstallScriptPath = resolve(process.resourcesPath, "uninstall.bat");
    const uninstallScriptTempPath = resolve(app.getPath("temp"), "proton-mail-uninstall.bat");

    log(`Copying uninstall script "${uninstallScriptPath}" to "${uninstallScriptTempPath}"`);
    copyFileSync(uninstallScriptPath, uninstallScriptTempPath);

    const args = [
        process.pid.toString(),
        `"${resolve(app.getPath("home"), "AppData", "Local", "proton_mail")}"`,
        `"${resolve(app.getPath("home"), "AppData", "Roaming", "Proton Mail")}"`,
        `"${uninstallScriptTempPath}"`,
    ];

    log(`Spawing uninstall process: ${uninstallScriptTempPath} ${args.join(" ")}`);
    const uninstallProcess = spawn(uninstallScriptTempPath, args, {
        cwd: app.getPath("temp"),
        detached: true,
        shell: true,
        // Detach stdio from current process so we can run the process separately
        stdio: ["ignore", uninstallLogFileDescriptor, uninstallLogFileDescriptor],
        // Do not show shell window to users
        windowsHide: true,
        // Do not autoescape arguments
        windowsVerbatimArguments: true,
    });

    // Unlink the opened process from the electron app so we can close the application
    // and keep the uninstall script running.
    uninstallProcess.unref();

    // Now wait until the uninstall script kills the electron process
    // WARN: We need to create an unresolved promise here so the execution is blocked
    // until the uninstall script kills electron. We want to do this instead of manually
    // exiting with `app.quit()` or `app.exit()` to avoid any side effect.
    log("Uninstall process started");
    await new Promise(() => {});
}

export async function handleSquirrelEvents() {
    if (!isSquirrelStartup()) return;

    squirrelLogger.info("Startup");

    const squirrelCommand = process.argv[1] ?? null;

    switch (squirrelCommand) {
        case SQUIRREL_INSTALL:
            squirrelLogger.info("Install:", process.argv);
            await handleInstallShortcuts();
            await installProtocols();
            setInstallSource(parseInstallArguments(process.argv).source || "own");
            break;
        case SQUIRREL_UPDATED:
            squirrelLogger.info("Updated:", process.argv);
            // During update the path to exe can change. Therefore we want to
            // update the lnk if they exists.
            await handleUpdatedShortcuts();
            await updateProtocols();
            break;
        case SQUIRREL_UNINSTALL: {
            squirrelLogger.info("Uninstall:", process.argv);
            await handleUninstallShortcuts();
            await uninstallProtocols();
            await spawnUninstallProcess();
            break;
        }
        case SQUIRREL_OBSOLETE:
            squirrelLogger.info("Obsolete:", process.argv);
            break;
    }

    // WARN: App quit gracefully stops all electron processes asynchronously,
    // so unless we block the execution before this point (like we do during the
    // uninstall process) the app startup will continue.
    app.quit();
}
