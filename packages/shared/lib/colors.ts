import tinycolor, { ColorFormats } from 'tinycolor2';
import { c } from 'ttag';

import { SimpleMap } from '@proton/shared/lib/interfaces';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

export const ACCENT_COLORS_MAP = {
    purple: { color: '#8080FF', getName: () => c('color').t`purple` },
    pink: { color: '#DB60D6', getName: () => c('color').t`pink` },
    strawberry: { color: '#EC3E7C', getName: () => c('color').t`strawberry` },
    carrot: { color: '#F78400', getName: () => c('color').t`carrot` },
    sahara: { color: '#936D58', getName: () => c('color').t`sahara` },
    enzian: { color: '#5252CC', getName: () => c('color').t`enzian` },
    plum: { color: '#A839A4', getName: () => c('color').t`plum` },
    cerise: { color: '#BA1E55', getName: () => c('color').t`cerise` },
    copper: { color: '#C44800', getName: () => c('color').t`copper` },
    soil: { color: '#54473F', getName: () => c('color').t`soil` },
    slateblue: { color: '#415DF0', getName: () => c('color').t`slateblue` },
    pacific: { color: '#179FD9', getName: () => c('color').t`pacific` },
    reef: { color: '#1DA583', getName: () => c('color').t`reef` },
    fern: { color: '#3CBB3A', getName: () => c('color').t`fern` },
    olive: { color: '#B4A40E', getName: () => c('color').t`olive` },
    cobalt: { color: '#273EB2', getName: () => c('color').t`cobalt` },
    ocean: { color: '#0A77A6', getName: () => c('color').t`ocean` },
    pine: { color: '#0F735A', getName: () => c('color').t`pine` },
    forest: { color: '#258723', getName: () => c('color').t`forest` },
    pickle: { color: '#807304', getName: () => c('color').t`pickle` },
};

export const ACCENT_COLORS = Object.values(ACCENT_COLORS_MAP).map(({ color }) => color);

const COLOR_NAME_MAP = Object.values(ACCENT_COLORS_MAP).reduce<SimpleMap<() => string>>((acc, { color, getName }) => {
    acc[color] = getName;

    return acc;
}, {});

export const getColorName = (color: string) => {
    return COLOR_NAME_MAP[color.toUpperCase()]?.();
};

export const getRandomAccentColor = () => ACCENT_COLORS[randomIntFromInterval(0, ACCENT_COLORS.length - 1)];

// Euclidean distance between colors
const getColorDistance = (color1: ColorFormats.RGBA, color2: ColorFormats.RGBA): number => {
    return Math.sqrt((color1.r - color2.r) ** 2 + (color2.g - color2.g) ** 2 + (color1.b - color2.b) ** 2);
};

export const getClosestProtonColor = (inputColor: string): string | undefined => {
    const color = tinycolor(inputColor);

    if (color.isValid()) {
        const inputColorRGB = color.toRgb();
        let closestColor;
        let closestDistance: number;

        ACCENT_COLORS.forEach((protonColor) => {
            const protonColorRGB = tinycolor(protonColor).toRgb();
            const colorDistance = getColorDistance(protonColorRGB, inputColorRGB);

            if (closestDistance === undefined || colorDistance < closestDistance) {
                closestDistance = colorDistance;
                closestColor = protonColor;
            }
        });

        return closestColor;
    }
    return undefined;
};

// List of CSS3 colors https://www.w3.org/TR/css-color-3/#svg-color
export const CSS3_COLORS = [
    'aliceblue',
    'antiquewhite',
    'aqua',
    'aquamarine',
    'azure',
    'beige',
    'bisque',
    'black',
    'blanchedalmond',
    'blue',
    'blueviolet',
    'brown',
    'burlywood',
    'cadetblue',
    'chartreuse',
    'chocolate',
    'coral',
    'cornflowerblue',
    'cornsilk',
    'crimson',
    'cyan',
    'darkblue',
    'darkcyan',
    'darkgoldenrod',
    'darkgray',
    'darkgreen',
    'darkgrey',
    'darkkhaki',
    'darkmagenta',
    'darkolivegreen',
    'darkorange',
    'darkorchid',
    'darkred',
    'darksalmon',
    'darkseagreen',
    'darkslateblue',
    'darkslategray',
    'darkslategrey',
    'darkturquoise',
    'darkviolet',
    'deeppink',
    'deepskyblue',
    'dimgray',
    'dimgrey',
    'dodgerblue',
    'firebrick',
    'floralwhite',
    'forestgreen',
    'fuchsia',
    'gainsboro',
    'ghostwhite',
    'gold',
    'goldenrod',
    'gray',
    'green',
    'greenyellow',
    'grey',
    'honeydew',
    'hotpink',
    'indianred',
    'indigo',
    'ivory',
    'khaki',
    'lavender',
    'lavenderblush',
    'lawngreen',
    'lemonchiffon',
    'lightblue',
    'lightcoral',
    'lightcyan',
    'lightgoldenrodyellow',
    'lightgray',
    'lightgreen',
    'lightgrey',
    'lightpink',
    'lightsalmon',
    'lightseagreen',
    'lightskyblue',
    'lightslategray',
    'lightslategrey',
    'lightsteelblue',
    'lightyellow',
    'lime',
    'limegreen',
    'linen',
    'magenta',
    'maroon',
    'mediumaquamarine',
    'mediumblue',
    'mediumorchid',
    'mediumpurple',
    'mediumseagreen',
    'mediumslateblue',
    'mediumspringgreen',
    'mediumturquoise',
    'mediumvioletred',
    'midnightblue',
    'mintcream',
    'mistyrose',
    'moccasin',
    'navajowhite',
    'navy',
    'oldlace',
    'olive',
    'olivedrab',
    'orange',
    'orangered',
    'orchid',
    'palegoldenrod',
    'palegreen',
    'paleturquoise',
    'palevioletred',
    'papayawhip',
    'peachpuff',
    'peru',
    'pink',
    'plum',
    'powderblue',
    'purple',
    'red',
    'rosybrown',
    'royalblue',
    'saddlebrown',
    'salmon',
    'sandybrown',
    'seagreen',
    'seashell',
    'sienna',
    'silver',
    'skyblue',
    'slateblue',
    'slategray',
    'slategrey',
    'snow',
    'springgreen',
    'steelblue',
    'tan',
    'teal',
    'thistle',
    'tomato',
    'turquoise',
    'violet',
    'wheat',
    'yellowgreen',
];
