const ucFirst = (input = '') => input.charAt(0).toUpperCase() + input.slice(1);

const parseArgRgb = (args) => {
    if (/^rgb/.test(args[0] || '')) {
        return args[0]
            .replace(/ |rgb\(|\)/g, '')
            .split(',')
            .map(Number);
    }
    return args;
};

function rgbToHex(...args) {
    return parseArgRgb(args)
        .reduce(
            (acc, value) => {
                const hex = value.toString(16);
                acc.push(hex.length === 1 ? `0${hex}` : hex);
                return acc;
            },
            ['#']
        )
        .join('');
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.replace(/^#/, ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgb(${r}, ${g}, ${b})`;
}

module.exports = { ucFirst, rgbToHex, hexToRgb };
