import type { IconName } from '../../../components/LumoIcon/LumoIcon';

/** Lucide path data (24×24 viewBox) for icons drawn onto the share-card canvas. */
const ICON_PATHS: Partial<Record<IconName, string[]>> = {
    Zap: [
        'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
    ],
    BadgeDollarSign: [
        'M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z',
        'M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8',
        'M12 18V6',
    ],
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

/** Rasterise a Lucide icon to an image for canvas drawing — no PNG assets required. */
export const loadLucideIconImage = (name: IconName, size: number, color: string): Promise<HTMLImageElement> => {
    const paths = ICON_PATHS[name];
    if (!paths) {
        return Promise.reject(new Error(`Share card icon not defined: ${name}`));
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths.map((d) => `<path d="${d}"/>`).join('')}</svg>`;
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return loadImage(url);
};
