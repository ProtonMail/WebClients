import { app } from "electron";
import { resolve, basename, dirname } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { protocolLogger } from "../log";
import { quitTracker } from "../log/quitTracker";

export async function registerMailtoApp() {
    const regFile = createRegFile();
    if (!regFile) {
        protocolLogger.error("Failed to create register file");
        return;
    }

    try {
        await spawnRegImport(regFile);
    } catch (err) {
        protocolLogger.error("Failed to import registry file:", err);
    }
}

export async function unregisterMailtoApp() {
    const regFile = resolve(process.resourcesPath, "protonmail-mailto-delete.reg");

    try {
        await spawnRegImport(regFile);
    } catch (err) {
        protocolLogger.error("Failed to import de-register file:", err);
    }
}

function createRegFile(): string {
    const regTemplatePath = resolve(process.resourcesPath, "protonmail-mailto-register.reg");
    const regFilePath = resolve(app.getPath("temp"), "protonmail-mailto-register.reg");

    try {
        const templateData = readFileSync(regTemplatePath);
        if (!templateData) {
            protocolLogger.error(`Register template is empty ${regTemplatePath}`);
            return "";
        }

        const targetExe = resolve(dirname(process.execPath), "..", basename(process.execPath));
        const escapeBackslash = (str: string) => str.replace(/\\/g, "\\\\");
        const content = templateData.toString().replace(/{{TARGET_EXE}}/g, escapeBackslash(targetExe));

        try {
            writeFileSync(regFilePath, content);
            return regFilePath;
        } catch (err) {
            protocolLogger.error(`Cannot write register file ${regFilePath}: ${err}`);
            return "";
        }
    } catch (err) {
        protocolLogger.error(`Cannot read register template ${regTemplatePath}: ${err}`);
        return "";
    }
}

export const getRegExe = () => (process.env.SystemRoot ? `${process.env.SystemRoot}\\System32\\reg.exe` : "reg.exe");

function spawnRegImport(regFile: string): Promise<void> {
    const regExe = getRegExe();

    const args = ["import", regFile];
    protocolLogger.log(`Spawning reg process: ${regExe} ${args.join(" ")}`);
    const regProcess = spawn(regExe, args, {
        cwd: app.getPath("temp"),
        windowsHide: true,
        windowsVerbatimArguments: true,
    });
    regProcess.stdout.on("data", (data) => {
        protocolLogger.info("reg.exe:", data);
    });
    regProcess.stderr.on("data", (data) => {
        protocolLogger.error("reg.exe:", data);
    });

    return new Promise((resolve, reject) => {
        regProcess.on("close", (code, signal) => {
            protocolLogger.info(`Reg process exited with code ${code}, signal ${signal}`);
            quitTracker.setReason("register-mailto-exited");
            app.quit();
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`reg.exe exited with code ${code}`));
            }
        });
    });
}
