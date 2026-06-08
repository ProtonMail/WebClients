/** Custom icon file attachment convention.
 * Icon files are stored as regular file attachments with a
 * special filename prefix to distinguish them from user files. */

export const CUSTOM_ICON_PREFIX = '__pass_custom_icon__';
export const CUSTOM_ICON_MAX_SIZE = 512 * 1024; // 512KB input limit
export const CUSTOM_ICON_MAX_DIMENSION = 64;
export const CUSTOM_ICON_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export const isCustomIconFile = (name: string): boolean => name.startsWith(CUSTOM_ICON_PREFIX);

/** Resize and convert an image file to a 64x64 PNG for use as an item icon. */
export const processIconImage = (file: File): Promise<File> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const canvas = document.createElement('canvas');
            canvas.width = CUSTOM_ICON_MAX_DIMENSION;
            canvas.height = CUSTOM_ICON_MAX_DIMENSION;

            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context unavailable'));

            /** Draw the image centered and scaled to cover the square,
             * maintaining aspect ratio (center-crop). */
            const { naturalWidth: sw, naturalHeight: sh } = img;
            const scale = Math.max(CUSTOM_ICON_MAX_DIMENSION / sw, CUSTOM_ICON_MAX_DIMENSION / sh);
            const dw = sw * scale;
            const dh = sh * scale;
            const dx = (CUSTOM_ICON_MAX_DIMENSION - dw) / 2;
            const dy = (CUSTOM_ICON_MAX_DIMENSION - dh) / 2;

            ctx.drawImage(img, dx, dy, dw, dh);

            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error('Failed to create icon blob'));
                    resolve(new File([blob], `${CUSTOM_ICON_PREFIX}.png`, { type: 'image/png' }));
                },
                'image/png',
                1
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
