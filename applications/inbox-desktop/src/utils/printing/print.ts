import { app, BrowserWindow, dialog } from "electron";
import { promises } from "node:fs";
import path from "node:path";
import { getMainWindow } from "../view/viewManagement";
import { isWindowValid } from "../view/windowUtils";

const loadTimeoutMs = 200;
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

function printHTML(htmlContent: string) {
    const printWindow = createPrintWindow();

    validPrintContent.add(htmlContent);
    printWindow.loadURL(`${PRINT_DATA_URL_PREFIX}${encodeURIComponent(htmlContent)}`);

    printWindow.webContents.on("did-finish-load", () => {
        // Timeout needed for page to load content properly.
        setTimeout(() => {
            printWindow.webContents.print({}, (_) => {
                if (isWindowValid(printWindow)) printWindow.close();
            });
        }, loadTimeoutMs);
    });
}

async function printAndSaveToPDF(parentWindow: BrowserWindow, htmlContent: string) {
    try {
        const { filePath, canceled } = await dialog.showSaveDialog(parentWindow, {
            title: "Save PDF",
            defaultPath: path.join(app.getPath("documents"), "Proton_Mail.pdf"),
            filters: [{ name: "PDF files", extensions: ["pdf"] }],
        });

        if (canceled || !filePath) return;

        const pdfWindow = createPrintWindow();

        validPrintContent.add(htmlContent);
        pdfWindow.loadURL(`${PRINT_DATA_URL_PREFIX}${encodeURIComponent(htmlContent)}`);

        pdfWindow.webContents.on("did-finish-load", async () => {
            setTimeout(async () => {
                const data = await pdfWindow.webContents.printToPDF({
                    pageSize: "A4",
                });

                await promises.writeFile(filePath, data);
                if (isWindowValid(pdfWindow)) pdfWindow.close();

                if (isWindowValid(parentWindow)) {
                    dialog.showMessageBox(parentWindow, {
                        type: "info",
                        message: "PDF saved successfully!",
                    });
                }
            }, loadTimeoutMs);
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
        });
}
