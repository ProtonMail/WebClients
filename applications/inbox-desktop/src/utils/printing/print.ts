import { app, BrowserWindow, dialog } from "electron";
import { promises, unlinkSync, writeFileSync } from "node:fs";
import path, { join } from "node:path";
import { getMainWindow } from "../view/viewManagement";
import { isWindowValid } from "../view/windowUtils";
import { printLogger } from "../log";

const LOAD_TIMEOUT_MS = 300;
const MAX_DATA_URL_LENGTH = 1000000;

type PrintAction = (window: BrowserWindow) => Promise<void>;

export const PRINT_DATA_URL_PREFIX = "data:text/html;charset=utf-8,";
export const validPrintContent = new Set<string>();

const createPrintWindow = () => {
    return new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: false,
        },
    });
};

async function withPrintWindowViaFile(htmlContent: string, action: PrintAction): Promise<void> {
    const window = createPrintWindow();

    const tempPath = join(app.getPath("temp"), `print-${Date.now().toString(36)}.html`);
    writeFileSync(tempPath, htmlContent, "utf-8");
    window.loadFile(tempPath);

    const cleanup = () => {
        try {
            unlinkSync(tempPath);
        } catch (e) {
            // Ignore
        }
        if (isWindowValid(window)) window.close();
    };

    return new Promise((resolve, reject) => {
        window.webContents.on("did-fail-load", (_, errorCode, errorDesc) => {
            printLogger.error("Failed to load content:", errorCode, errorDesc);
            cleanup();
            reject(new Error(`Failed to load content: ${errorDesc}`));
        });

        window.webContents.on("did-finish-load", () => {
            setTimeout(async () => {
                try {
                    await action(window);
                    resolve();
                } catch (error) {
                    reject(error);
                } finally {
                    cleanup();
                }
            }, LOAD_TIMEOUT_MS);
        });
    });
}

async function withPrintWindowViaURL(htmlContent: string, action: PrintAction): Promise<void> {
    const window = createPrintWindow();

    validPrintContent.add(htmlContent);
    window.loadURL(`${PRINT_DATA_URL_PREFIX}${encodeURIComponent(htmlContent)}`);

    const cleanup = () => {
        if (isWindowValid(window)) window.close();
    };

    return new Promise((resolve, reject) => {
        window.webContents.on("did-fail-load", (_, errorCode, errorDesc) => {
            printLogger.error("Failed to load content:", errorCode, errorDesc);
            cleanup();
            reject(new Error(`Failed to load content: ${errorDesc}`));
        });

        window.webContents.on("did-finish-load", () => {
            setTimeout(async () => {
                try {
                    await action(window);
                    resolve();
                } catch (error) {
                    reject(error);
                } finally {
                    cleanup();
                }
            }, LOAD_TIMEOUT_MS);
        });
    });
}

function withPrintWindow(htmlContent: string, action: PrintAction): Promise<void> {
    const encodedLength = PRINT_DATA_URL_PREFIX.length + encodeURIComponent(htmlContent).length;
    if (encodedLength > MAX_DATA_URL_LENGTH) {
        return withPrintWindowViaFile(htmlContent, action);
    }
    return withPrintWindowViaURL(htmlContent, action);
}

async function printHTML(htmlContent: string) {
    printLogger.info(`Handling print, size: ${htmlContent.length}`);

    try {
        await withPrintWindow(htmlContent, (window) => {
            return new Promise((resolve) => {
                window.webContents.print({}, (success, failureReason) => {
                    if (!success && failureReason !== "cancelled") {
                        printLogger.error("Print failed:", failureReason);
                    }
                    resolve();
                });
            });
        });
    } catch (error) {
        printLogger.error("Print error:", error);
    }
}

async function printAndSaveToPDF(parentWindow: BrowserWindow, htmlContent: string) {
    printLogger.info(`Handling printing to PDF, size: ${htmlContent.length}`);

    const { filePath, canceled } = await dialog.showSaveDialog(parentWindow, {
        title: "Save PDF",
        defaultPath: path.join(app.getPath("documents"), "Proton_Mail.pdf"),
        filters: [{ name: "PDF files", extensions: ["pdf"] }],
    });

    if (canceled || !filePath) return;

    try {
        await withPrintWindow(htmlContent, async (window) => {
            const data = await window.webContents.printToPDF({ pageSize: "A4" });
            await promises.writeFile(filePath, data);

            if (isWindowValid(parentWindow)) {
                dialog.showMessageBox(parentWindow, {
                    type: "info",
                    message: "PDF saved successfully!",
                });
            }
        });
    } catch (error) {
        dialog.showErrorBox("Save Failed", (error as Error).message);
    }
}

export function showPrintDialog(htmlContent: string) {
    const mainWindow = getMainWindow();
    if (!isWindowValid(mainWindow)) return;

    dialog
        .showMessageBox(mainWindow, {
            type: "question",
            buttons: ["Save as PDF", "Print", "Cancel"],
            defaultId: 0,
            title: "Print Options",
            message: "What would you like to do?",
        })
        .then(({ response }) => {
            if (response === 0) {
                printAndSaveToPDF(mainWindow, htmlContent);
            } else if (response === 1) {
                printHTML(htmlContent);
            }
        })
        .catch((error) => {
            printLogger.error("Print dialog error:", error);
        });
}
