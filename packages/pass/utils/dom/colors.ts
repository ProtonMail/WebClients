const HEX_LENGTHS = [3 /** RGB */, 4 /** RGBA */, 6 /** RRGGBB */, 8 /** RRGGBBAA */];

export const intoColorHex = (color?: string) => {
    if (!color) return color;
    const match = color.match(/^#?([0-9A-Fa-f]+)$/);
    if (match && HEX_LENGTHS.includes(match[1].length)) return `#${match[1]}`;
    return color;
};
