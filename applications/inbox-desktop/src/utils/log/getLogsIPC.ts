import log from "electron-log";
import fs from "node:fs";
import { ipcLogger } from ".";

const MAX_SIZE_BYTES = 20 * 1024 * 1024;

export async function getLogs(maxSizeBytes = MAX_SIZE_BYTES): Promise<Uint8Array | null> {
    try {
        const logPath = log.transports.file.getFile().path;
        const stats = await fs.promises.stat(logPath);

        if (stats.size === 0) {
            return null;
        }

        let buffer: Buffer;
        if (stats.size <= maxSizeBytes) {
            buffer = await fs.promises.readFile(logPath);
        } else {
            const fileHandle = await fs.promises.open(logPath, "r");
            const readBuffer = Buffer.alloc(maxSizeBytes);
            // stats.size - maxSizeBytes is the read position, so we only read the last N bytes
            await fileHandle.read(readBuffer, 0, maxSizeBytes, stats.size - maxSizeBytes);
            await fileHandle.close();

            // Find first complete line
            let content = readBuffer.toString("utf8");
            const firstNewline = content.indexOf("\n");
            if (firstNewline > 0) {
                content = content.substring(firstNewline + 1);
            }

            // Add truncation notice
            const truncatedKB = Math.round((stats.size - maxSizeBytes) / 1024);
            const notice = `[Truncated ${truncatedKB}KB from start - showing last ${Math.round(maxSizeBytes / 1024)}KB]\n\n`;
            buffer = Buffer.from(notice + content, "utf8");
        }

        ipcLogger.info(`Logs collected: ${buffer.length} bytes`);
        return new Uint8Array(buffer);
    } catch (error) {
        ipcLogger.error("Could not collect logs, error:", error);
        return null;
    }
}
