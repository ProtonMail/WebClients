import { app } from "electron";
import { resolve, basename, dirname } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { protocolLogger } from "../log";

export async function registerMailtoApp() {
    const regFile = createRegFile();
    if (!regFile) {
        protocolLogger.error("Failed to create register file");
        return;
    }

    spawnRegImport(regFile);
}

export async function unregisterMailtoApp() {
    const regFile = resolve(process.resourcesPath, "protonmail-mailto-delete.reg");
    if (!regFile) {
        protocolLogger.error("Failed to resolve de-register file");
        return;
    }

    spawnRegImport(regFile);
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

async function spawnRegImport(regFile: string) {
    const regExe = process.env.SystemRoot ? resolve(process.env.SystemRoot, "System32", "reg.exe") : "reg.exe";

    const args = ["import", regFile];
    protocolLogger.log(`Spawing reg process: ${regExe} ${args.join(" ")}`);
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
    regProcess.on("close", (code, signal) => {
        protocolLogger.info(`Reg process exited with code ${code}, signal ${signal}`);
        app.quit();
    });
}
