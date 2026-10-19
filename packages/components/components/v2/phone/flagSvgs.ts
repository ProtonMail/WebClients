import flags from '@proton/styles/flagSvgs';

const flagsMap = flags.keys().reduce<Partial<{ [key: string]: () => string }>>((acc, key) => {
    acc[key] = () => flags(key);
    return acc;
}, {});

export const getFlagSvg = (abbreviation: string) => {
    const key = `./${abbreviation.toUpperCase()}.svg`;
    if (!flagsMap[key]) {
        return;
    }
    return flagsMap[key]?.();
};
