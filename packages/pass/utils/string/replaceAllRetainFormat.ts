/* replace all characters expect spaces and retain line breaks */
export const replaceAllRetainFormat = (value: string, replacement: string) => {
    return value
        .split(/\r?\n/g)
        .map((line) => line.replaceAll(/\S/g, replacement))
        .join('\r\n');
};
