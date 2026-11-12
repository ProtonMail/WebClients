// Safari saves `filename` as is --> add RFC 6266 `filename*`, which browsers decode and prefer.
export const getContentDisposition = (filename: string) => {
    const encodedFilename = encodeURIComponent(filename);
    const extendedFilename = encodedFilename.replace(
        /['()*]/g,
        (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
    );
    return `attachment; filename="${encodedFilename}"; filename*=UTF-8''${extendedFilename}`;
};
