import type { IPCInboxHostUpdateMessage } from "@proton/shared/lib/desktop/desktopTypes";

// THIS NEEDS REFACTOR: inda-refactor-001
// Either avoid this function completelly or at least implemet it in zod.
export function isValidHostUpdateMessage(
    data: unknown,
): { success: false; error: string } | { success: true; data: IPCInboxHostUpdateMessage } {
    if (!data) {
        return { success: false, error: "is null" };
    }
    if (typeof data !== "object") {
        return { success: false, error: "not an object" };
    }

    if (!("type" in data)) {
        return { success: false, error: "not have type" };
    }

    if (typeof data.type !== "string") {
        return { success: false, error: "have non-string type" };
    }

    if (!("payload" in data)) {
        return { success: false, error: "not have payload" };
    }

    const allowedTypes = ["captureMessage", "defaultMailtoChecked"];
    if (allowedTypes.indexOf(data.type) > -1) {
        return { success: true, data: data as IPCInboxHostUpdateMessage };
    }

    return { success: false, error: `unknown type ${data.type}` };
} // Assuming that broker was added as window object.
