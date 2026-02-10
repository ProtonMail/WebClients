import { app, dialog } from "electron";
import { c } from "ttag";
import { mainLogger, sanitizeUrlForLogging } from "./index";

function sanitizeErrorForLogging(reason: unknown): unknown {
    if (reason instanceof Error) {
        const sanitizedError: Record<string, unknown> = {
            name: sanitizeMessageForLogging(reason.name),
            message: sanitizeMessageForLogging(reason.message),
        };

        if ("code" in reason && typeof reason.code === "string") {
            sanitizedError.code = reason.code;
        }

        if (reason.stack) {
            sanitizedError.stack = sanitizeStackTrace(reason.stack);
        }

        return sanitizedError;
    }

    if (typeof reason === "string") {
        return sanitizeMessageForLogging(reason);
    }

    return String(reason);
}

function sanitizeMessageForLogging(message: string): string {
    const words = message.split(/\s+/);
    const sanitizedWords = words.map((word) => {
        const hasProtocol = word.includes("://") || word.startsWith("http");

        return hasProtocol ? sanitizeUrlForLogging(word) : word;
    });

    return sanitizedWords.join(" ");
}

export function sanitizeStackTrace(stack: string): string {
    const lines = stack.split("\n");
    const sanitizedLines = lines.map((line) => {
        if (line.includes("://")) {
            return line.replace(/https?:\/\/[^\s)]+/g, (url) => {
                return sanitizeUrlForLogging(url);
            });
        }

        return line;
    });

    return sanitizedLines.join("\n");
}

export function captureUncaughtErrors() {
    process.on("unhandledRejection", (reason) => {
        mainLogger.warn("unhandledRejection", sanitizeErrorForLogging(reason));
    });

    process.on("uncaughtException", (reason, origin) => {
        captureTopLevelRejection(reason, origin);
    });
}

export function captureTopLevelRejection(reason: unknown, origin?: NodeJS.UncaughtExceptionOrigin) {
    mainLogger.error("uncaughtException", sanitizeErrorForLogging(reason), origin);
    dialog.showErrorBox(
        c("Error dialog").t`Unexpected error`,
        c("Error dialog")
            .t`Due to an error, the app will close. Try running it again and, if the problem persists, contact us. Information about the error can be found in the application log.`,
    );
    app.exit(1);
}
