import { c } from 'ttag';

import { SimpleMap } from '@proton/shared/lib/interfaces';

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
