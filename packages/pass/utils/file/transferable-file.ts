/** Transferable File Format: This addresses the limitations of traditional message passing
 * (postMessaging or extension message passing) when dealing with non-serializable payloads.
 * It introduces a TransferableFile format that encapsulates files as base64-encoded strings
 * with metadata (mimetype and filename). */
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

export type TransferableFile = {
    /** base64 encoded representation of the underlying file */
    base64: string;
    /** mimetype of the file */
    type: string;
    /** filename */
    name: string;
};

export const fileToTransferable = async (file: File): Promise<TransferableFile> => {
    const data = new Uint8Array(await file.arrayBuffer());

    return {
        base64: uint8ArrayToBase64String(data),
        type: file.type,
        name: file.name,
    };
};

export const transferableToFile = ({ base64, name, type }: TransferableFile): File => {
    const blob = new Blob([base64StringToUint8Array(base64)], { type });
    return new File([blob], name, { type });
};
