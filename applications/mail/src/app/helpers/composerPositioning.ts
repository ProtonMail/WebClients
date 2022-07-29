import { getCustomSizingClasses } from '@proton/components';

import { WindowSize } from '../models/utils';

export const MAX_ACTIVE_COMPOSER_DESKTOP = 3;
export const MAX_ACTIVE_COMPOSER_MOBILE = 1;

export const COMPOSER_WIDTH = 640;
export const COMPOSER_GUTTER = 15;
const COMPOSER_HEIGHT = 640;
const COMPOSER_VERTICAL_GUTTER = 10;
const COMPOSER_SWITCH_MODE = 100;
const HEADER_HEIGHT = 80;
const APP_BAR_WIDTH = 45;

const COMPOSER_NARROW_STYLES = {
    position: 'fixed',
    '--top-custom': 0,
    '--bottom-custom': 0,
    '--left-custom': 0,
    '--right-custom': 0,
    '--height-custom': 'auto',
    '--width-custom': 'auto',
};

export const computeLeftPosition = (index: number, count: number, windowWidth: number) => {
    const neededWidth = COMPOSER_WIDTH * count + COMPOSER_GUTTER * (count + 1);

    let rightPosition: number;

    if (neededWidth < windowWidth) {
        rightPosition = COMPOSER_WIDTH * index + COMPOSER_GUTTER * (index + 1);
    } else {
        const widthToDivide = windowWidth - COMPOSER_GUTTER * 2 - COMPOSER_WIDTH;
        const share = widthToDivide / (count - 1);

        rightPosition = COMPOSER_GUTTER + share * index;
    }

    //console.log({rightPosition, res:(windowWidth - COMPOSER_WIDTH - rightPosition), gutter: COMPOSER_GUTTER})
    return windowWidth - COMPOSER_WIDTH - rightPosition;
};

const computeHeight = (windowHeight: number) => {
    const maxHeight = windowHeight - COMPOSER_VERTICAL_GUTTER - HEADER_HEIGHT;
    return maxHeight > COMPOSER_HEIGHT ? COMPOSER_HEIGHT : maxHeight;
};

interface ComputeComposerStyleOptions {
    // Composer index
    index: number;
    // Number of composer opened
    count: number;
    minimized: boolean;
    maximized: boolean;
    isNarrow: boolean;
    windowWidth: WindowSize['width'];
    windowHeight: WindowSize['height'];
}

interface ComputeComposerStyleReturns {
    style: Record<string, string | number>;
    customClasses?: string;
}

export const computeComposerStyle = ({
    index,
    count,
    minimized,
    maximized,
    isNarrow,
    windowWidth,
    windowHeight,
}: ComputeComposerStyleOptions): ComputeComposerStyleReturns => {
    let style: Record<string, string | number> = {
        '--left-custom': `${computeLeftPosition(index, count, windowWidth)}px`,
        computeHeight: `${computeHeight(windowHeight)}px`,
    };

    if (isNarrow) {
        style = COMPOSER_NARROW_STYLES;
    } else if (minimized) {
        style['--height-custom'] = '35px';
    } else if (maximized) {
        const composerWidth = windowWidth - COMPOSER_GUTTER - APP_BAR_WIDTH;
        style['--left-custom'] = `${windowWidth - composerWidth - COMPOSER_GUTTER}px`;
        style['--width-custom'] = `${composerWidth}px`;
        style['--height-custom'] = `${windowHeight - COMPOSER_VERTICAL_GUTTER * 2}px`;
    }

    return { style, customClasses: getCustomSizingClasses(style) };
};

export const shouldBeMaximized = (windowHeight: number) => windowHeight < COMPOSER_HEIGHT - COMPOSER_SWITCH_MODE;
