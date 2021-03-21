const flags = require.context('design-system/assets/img/shared/flags/4x3', true, /.svg$/);
const flagsMap = flags.keys().reduce<Partial<{ [key: string]: () => { default: string } }>>((acc, key) => {
    acc[key] = () => flags(key);
    return acc;
}, {});

export const getFlagSvg = (abbreviation: string) => {
    const key = `./${abbreviation.toLowerCase()}.svg`;
    if (!flagsMap[key]) {
        return;
    }
    return flagsMap[key]?.().default;
};
