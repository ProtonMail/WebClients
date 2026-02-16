import { ioStreamLogger } from "../log";

export function registerIOStreamErrorHandlers() {
    const handleStreamError = (streamName: string) => (err: NodeJS.ErrnoException) => {
        if (err.code === "EIO" || err.code === "EPIPE") {
            // Output target is gone. Nothing we can do, silently ignore.
            return;
        }

        ioStreamLogger.warn(`Unexpected ${streamName} error: ${err.code} - ${err.message}`);
    };

    process.stdout.on("error", handleStreamError("stdout"));
    process.stderr.on("error", handleStreamError("stderr"));
}
