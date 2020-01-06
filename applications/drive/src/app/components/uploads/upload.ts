export async function upload(url: string, content: Uint8Array, onProgress: (relativeIncrement: number) => void) {
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
        let lastLoaded = 0;
        xhr.upload.onprogress = (e) => {
            onProgress((e.loaded - lastLoaded) / e.total);
            lastLoaded = e.loaded;
        };
        xhr.onload = resolve;
        xhr.upload.onerror = reject;
        xhr.onerror = reject;
        xhr.open('put', url);
        xhr.setRequestHeader('Content-Type', 'application/x-binary');
        xhr.send(new Blob([content]));
    });
}
