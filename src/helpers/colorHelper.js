
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : undefined;
};

const hexToRgbString = (hex = '') => {
    const { r, g, b } = hexToRgb(hex.toLowerCase()) || {};
    if (r === undefined) {
        return '';
    }
    return `rgb(${r}, ${g}, ${b})`;
};

export {
    hexToRgb,
    hexToRgbString
};
