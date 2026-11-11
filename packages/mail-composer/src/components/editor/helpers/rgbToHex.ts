import tinycolor from 'tinycolor2';

const rgbToHex = (rgb = '') => {
    const color = tinycolor(rgb);

    if (!color) {
        return;
    }

    return color.toHexString();
};

export default rgbToHex;
