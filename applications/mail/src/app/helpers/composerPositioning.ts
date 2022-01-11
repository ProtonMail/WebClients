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

export const computeRightPosition = (index: number, count: number, windowWidth: number) => {
    const neededWidth = COMPOSER_WIDTH * count + COMPOSER_GUTTER * (count + 1);

    if (neededWidth < windowWidth) {
        return COMPOSER_WIDTH * index + COMPOSER_GUTTER * (index + 1);
    }

    const widthToDivide = windowWidth - COMPOSER_GUTTER * 2 - COMPOSER_WIDTH;
    const share = widthToDivide / (count - 1);
    return COMPOSER_GUTTER + share * index;
};

const computeHeight = (windowHeight: number) => {
    const maxHeight = windowHeight - COMPOSER_VERTICAL_GUTTER - HEADER_HEIGHT;
    return maxHeight > COMPOSER_HEIGHT ? COMPOSER_HEIGHT : maxHeight;
};

export const computeComposerStyle = (
    index: number,
    count: number,
    focus: boolean,
    minimized: boolean,
    maximized: boolean,
    isNarrow: boolean,
    windowSize: WindowSize
) => {
    if (isNarrow) {
        return {
            position: 'fixed',
            '--top-custom': 0,
            '--bottom-custom': 0,
            '--left-custom': 0,
            '--right-custom': 0,
            '--height-custom': 'auto',
            '--width-custom': 'auto',
        };
    }

    const style = {
        '--right-custom': `${computeRightPosition(index, count, windowSize.width)}px`,
        '--z-position': focus ? 1 : 0,
        computeHeight: `${computeHeight(windowSize.height)}px`,
    };

    if (minimized) {
        return {
            ...style,
            '--height-custom': `35px`,
        };
    }

    if (maximized) {
        return {
            ...style,
            '--right-custom': `${COMPOSER_GUTTER}px`,
            '--width-custom': `${windowSize.width - COMPOSER_GUTTER - APP_BAR_WIDTH}px`,
            '--height-custom': `${windowSize.height - COMPOSER_VERTICAL_GUTTER * 2}px`,
        };
    }

    return style;
};

export const shouldBeMaximized = (windowHeight: number) => windowHeight < COMPOSER_HEIGHT - COMPOSER_SWITCH_MODE;
