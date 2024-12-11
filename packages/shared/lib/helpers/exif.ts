function loadImage(file: File): Promise<ImageBitmap> {
    if (!('createImageBitmap' in window)) {
        throw new Error('createImageBitmap is not supported in this environment');
    }
    return createImageBitmap(file);
}

async function removeImageMetadata(file: File): Promise<File> {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('bitmaprenderer');

    if (!ctx) {
        throw new Error('BitmapRenderer context is unavailable');
    }

    canvas.width = img.width;
    canvas.height = img.height;

    // Transfer the ImageBitmap to canvas
    ctx.transferFromImageBitmap(img);
    // Note: no need to call img.close() here as transferFromImageBitmap
    // automatically closes the ImageBitmap

    // Export image as a data URL or Blob (without EXIF)
    const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('Failed to export image as a blob');
            }
            resolve(blob);
        }, file.type)
    );

    return new File([blob], file.name, { type: file.type, lastModified: Date.now() });
}

async function removeExifMetadata(file: File): Promise<File> {
    switch (file.type) {
        case 'image/jpeg':
        case 'image/webp':
        case 'image/png':
        case 'image/tiff':
        case 'image/heic':
            return removeImageMetadata(file);
        case 'image/gif': // Not yet supported
        default:
            // Unsupported file type for metadata removal
            return file;
    }
}

export default removeExifMetadata;
