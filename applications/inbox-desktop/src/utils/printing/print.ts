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

const PREVIEW_ACTION_PRINT = "https://proton-mail-print.invalid/print";
const PREVIEW_ACTION_SAVE_PDF = "https://proton-mail-print.invalid/save-pdf";
const PREVIEW_ACTION_CLOSE = "https://proton-mail-print.invalid/close";

// Toolbar injected at the top of the preview document. The buttons carry only
// a data-action attribute; their click handlers are attached from the main
// process (see showPreviewWindow) rather than via inline onclick, so they are
// not subject to the rendered email's Content-Security-Policy.
const PREVIEW_TOOLBAR = `
<style>
  #proton-print-toolbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 50px;
    background: #ffffff;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 10px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  #proton-print-toolbar .toolbar-title {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
  }
  #proton-print-toolbar button {
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    padding: 7px 16px;
    border-radius: 6px;
    cursor: pointer;
  }
  #proton-print-toolbar .btn-print {
    background: #2563eb;
    color: #ffffff;
    border: none;
  }
  #proton-print-toolbar .btn-pdf {
    background: #ffffff;
    color: #1a1a1a;
    border: 1px solid #d0d0d0;
  }
  #proton-print-toolbar .btn-close {
    background: #ffffff;
    color: #1a1a1a;
    border: 1px solid #d0d0d0;
  }
  body { margin-top: 58px !important; }
</style>
<div id="proton-print-toolbar">
  <span class="toolbar-title">Print Preview</span>
  <button class="btn-print" data-action="${PREVIEW_ACTION_PRINT}">Print</button>
  <button class="btn-pdf" data-action="${PREVIEW_ACTION_SAVE_PDF}">Save as PDF</button>
  <button class="btn-close" data-action="${PREVIEW_ACTION_CLOSE}">Close</button>
</div>
`;

function injectPreviewToolbar(htmlContent: string): string {
    if (/<body/i.test(htmlContent)) {
        return htmlContent.replace(/<body([^>]*)>/i, `<body$1>${PREVIEW_TOOLBAR}`);
    }
    return PREVIEW_TOOLBAR + htmlContent;
}

const createPrintWindow = () => {
    return new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: false,
        },
    });
};

const createPreviewWindow = () => {
    return new BrowserWindow({
        width: 800,
        height: 900,
        show: false,
        title: "Print Preview",
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

async function showPreviewWindow(htmlContent: string): Promise<void> {
    const mainWindow = getMainWindow();
    const previewWindow = createPreviewWindow();
    const previewContent = injectPreviewToolbar(htmlContent);

    const encodedLength = PRINT_DATA_URL_PREFIX.length + encodeURIComponent(previewContent).length;
    const useFile = encodedLength > MAX_DATA_URL_LENGTH;

    let tempPath: string | null = null;

    if (useFile) {
        tempPath = join(app.getPath("temp"), `print-preview-${Date.now().toString(36)}.html`);
        writeFileSync(tempPath, previewContent, "utf-8");
        previewWindow.loadFile(tempPath);
    } else {
        previewWindow.loadURL(`${PRINT_DATA_URL_PREFIX}${encodeURIComponent(previewContent)}`);
    }

    const cleanup = () => {
        if (tempPath) {
            try {
                unlinkSync(tempPath);
            } catch (_) {
                // Ignore
            }
            tempPath = null;
        }
        if (isWindowValid(previewWindow)) previewWindow.close();
    };

    previewWindow.webContents.on("did-fail-load", (_, errorCode, errorDesc) => {
        printLogger.error("Preview failed to load:", errorCode, errorDesc);
        cleanup();
    });

    previewWindow.webContents.on("did-finish-load", () => {
        // Attach the toolbar click handlers from the main process. Doing this
        // via executeJavaScript (rather than inline onclick attributes in the
        // injected toolbar HTML) means the handlers are not governed by the
        // rendered email's Content-Security-Policy. Some messages ship a
        // restrictive policy (e.g. script-src 'none') that would otherwise
        // silently disable the buttons. Each click navigates to a sentinel
        // URL, which the will-navigate handler below intercepts.
        previewWindow.webContents
            .executeJavaScript(
                `document.querySelectorAll("#proton-print-toolbar button[data-action]").forEach(function (button) {
                    button.addEventListener("click", function () {
                        window.location.href = button.getAttribute("data-action");
                    });
                });
                true;`
            )
            .catch((error) => {
                printLogger.error("Failed to initialize preview toolbar:", error);
            });

        previewWindow.show();
    });

    previewWindow.webContents.on("will-navigate", (event, url) => {
        event.preventDefault();

        if (url === PREVIEW_ACTION_PRINT) {
            printHTML(htmlContent).catch((error) => {
                printLogger.error("Print error from preview:", error);
            });
        } else if (url === PREVIEW_ACTION_SAVE_PDF) {
            const parent = isWindowValid(mainWindow) ? mainWindow : previewWindow;
            printAndSaveToPDF(parent, htmlContent).catch((error) => {
                printLogger.error("Save PDF error from preview:", error);
            });
        } else if (url === PREVIEW_ACTION_CLOSE) {
            cleanup();
        }
    });

    previewWindow.on("closed", () => {
        if (tempPath) {
            try {
                unlinkSync(tempPath);
            } catch (_) {
                // Ignore
            }
        }
    });
}

export function showPrintDialog(htmlContent: string) {
    showPreviewWindow(htmlContent).catch((error) => {
        printLogger.error("Print preview error:", error);
    });
}
