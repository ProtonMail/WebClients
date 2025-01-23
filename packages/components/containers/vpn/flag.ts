const flags = require.context('@proton/styles/assets/img/flags', true, /.svg$/);

const flagsMap = flags.keys().reduce(
    (acc, key) => {
        acc[key] = () => flags(key);

        return acc;
    },
    {} as Record<string, () => string>
);

export const getFlagSvg = (abbreviation: string) => flagsMap[`./${abbreviation}.svg`]?.();
