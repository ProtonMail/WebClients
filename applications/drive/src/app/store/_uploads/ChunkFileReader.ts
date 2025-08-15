export default class ChunkFileReader {
    private blob: Blob;

    private chunkSize: number;

    private offset = 0;

    constructor(file: Blob, chunkSize: number) {
        this.blob = file;
        this.chunkSize = chunkSize;
    }

    isEOF() {
        return this.offset >= this.blob.size;
    }

    async readNextChunk() {
        const fileReader = new FileReader();
        const blob = this.blob.slice(this.offset, this.offset + this.chunkSize);

        return new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
            fileReader.onerror = (e) => {
                reject(e.target?.error || new Error('Cannot open file for reading'));
            };

            fileReader.onabort = () => {
                reject(new Error('File read aborted'));
            };

            fileReader.onload = async (e) => {
                if (!e.target || !e.target.result || e.target?.error) {
                    return reject(e.target?.error || new Error('Cannot open file for reading'));
                }

                const result = new Uint8Array(e.target.result as ArrayBuffer);
                this.offset += result.byteLength;
                resolve(result);
            };

            fileReader.readAsArrayBuffer(blob);
        });
    }
}
