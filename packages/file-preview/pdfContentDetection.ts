// "%PDF-" PDF header
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d];
const PDF_HEADER_SEARCH_LIMIT = 1024;

const getFirstBytes = (chunks: Uint8Array<ArrayBuffer>[], length: number) => {
    const head = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        if (offset >= length) {
            break;
        }
        const part = chunk.subarray(0, length - offset);
        head.set(part, offset);
        offset += part.length;
    }
    return head.subarray(0, offset);
};

// Checks the content for the "%PDF-" header.
// The spec puts it on the first line (ISO 32000-1, 7.5.2 "File Header",
// https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf),
// but readers like Acrobat accept it anywhere in the first 1024 bytes, so we do too.
export const isPdfContent = (contents: Uint8Array<ArrayBuffer>[]) => {
    const head = getFirstBytes(contents, PDF_HEADER_SEARCH_LIMIT);
    for (let i = 0; i <= head.length - PDF_MAGIC_BYTES.length; i++) {
        if (PDF_MAGIC_BYTES.every((byte, j) => head[i + j] === byte)) {
            return true;
        }
    }
    return false;
};
