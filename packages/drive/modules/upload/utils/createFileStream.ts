/**
 * Creates a ReadableStream from a File by chunking it in controlled 4MB blocks.
 *
 * This approach reads the file in small pieces using file.slice() and blob.arrayBuffer(),
 * which keeps memory usage predictable and low across all browsers. The 4MB chunk size
 * matches the backend's block size for optimal upload performance.
 *
 * This is especially important for mobile browsers where file.stream() can load the
 * entire file into memory, but using manual chunking everywhere ensures consistent,
 * reliable behavior across all platforms.
 *
 * @param file - The File object to stream
 * @param chunkSize - Size of each chunk in bytes (default: 4MB to match backend block size)
 * @returns ReadableStream that yields Uint8Array chunks
 */
export function createFileStream(
    file: File,
    chunkSize: number = 4 * 1024 * 1024
): ReadableStream<Uint8Array<ArrayBuffer>> {
    let offset = 0;
    const fileSize = file.size;

    return new ReadableStream<Uint8Array<ArrayBuffer>>({
        async pull(controller) {
            if (offset >= fileSize) {
                controller.close();
                return;
            }

            const end = Math.min(offset + chunkSize, fileSize);
            const blob = file.slice(offset, end);

            try {
                const arrayBuffer = await blob.arrayBuffer();
                const chunk = new Uint8Array(arrayBuffer);
                controller.enqueue(chunk);
                offset = end;
            } catch (error) {
                controller.error(error);
            }
        },

        cancel() {
            offset = fileSize;
        },
    });
}
