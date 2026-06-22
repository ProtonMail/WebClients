export const createSyncAccessHandleSink = (
    handle: FileSystemSyncAccessHandle
): WritableStream<Uint8Array<ArrayBuffer>> => {
    let position = 0;

    const closeHandle = () => {
        handle.flush();
        handle.close();
    };

    return new WritableStream<Uint8Array<ArrayBuffer>>({
        write(chunk) {
            position += handle.write(chunk, { at: position });
            handle.flush();
        },
        close: closeHandle,
        abort: closeHandle,
    });
};
