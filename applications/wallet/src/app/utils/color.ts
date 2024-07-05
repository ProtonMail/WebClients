import { getRandomAccentColor } from '@proton/shared/lib/colors';

export const getNewRandomColor = (colors: string[]) => {
    let color = getRandomAccentColor();
    let tries = 0;
    while (colors.includes(color) && tries < 3) {
        color = getRandomAccentColor();
        tries++;
    }

    return color;
};
