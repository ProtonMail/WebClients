// Converts an IDBRequest into a Promise
export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Handles cursor iteration and collection of promises
export function withCursor(
    source: IDBIndex | IDBObjectStore,
    handleCursor: (cursor: IDBCursorWithValue) => Promise<void>
): Promise<void> {
    return new Promise((resolve, reject) => {
        const operationPromises: Promise<void>[] = [];

        const cursorRequest = source.openCursor();
        cursorRequest.onerror = () => reject(cursorRequest.error);

        cursorRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                operationPromises.push(handleCursor(cursor));
                cursor.continue();
            } else {
                Promise.all(operationPromises)
                    .then(() => resolve())
                    .catch(reject);
            }
        };
    });
}
