const flags = require.context('@proton/styles/assets/img/flags', true, /.svg$/);
const flagsMap = flags.keys().reduce<Partial<{ [key: string]: () => { default: string } }>>((acc, key) => {
    acc[key] = () => flags(key);
    return acc;
}, {});

export const getFlagSvg = (abbreviation: string) => {
    const key = `./${abbreviation}.svg`;
    if (!flagsMap[key]) {
        return;
    }
    return flagsMap[key]?.().default;
};
