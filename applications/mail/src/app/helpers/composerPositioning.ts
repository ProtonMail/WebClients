import { CSSProperties } from 'react';

import { WindowSize } from '../models/utils';

export const MAX_ACTIVE_COMPOSER_DESKTOP = 3;
export const MAX_ACTIVE_COMPOSER_MOBILE = 1;

const COMPOSER_WIDTH = 600;
const COMPOSER_HEIGHT = 520;
const COMPOSER_GUTTER = 20;
const COMPOSER_VERTICAL_GUTTER = 10;
const COMPOSER_ZINDEX = 300;
const COMPOSER_SWITCH_MODE = 20;
const HEADER_HEIGHT = 80;
const APP_BAR_WIDTH = 45;

const computeRightPosition = (index: number, count: number, windowWidth: number) => {
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
): CSSProperties => {
    if (isNarrow) {
        return {
            inset: 0,
            height: 'auto',
            width: 'auto'
        };
    }

    const style = {
        right: computeRightPosition(index, count, windowSize.width),
        zIndex: focus ? COMPOSER_ZINDEX + 1 : COMPOSER_ZINDEX,
        computeHeight: computeHeight(windowSize.height)
    };

    if (minimized) {
        return {
            ...style,
            height: 35
        };
    }

    if (maximized) {
        return {
            ...style,
            right: COMPOSER_GUTTER,
            width: windowSize.width - COMPOSER_GUTTER - APP_BAR_WIDTH,
            height: windowSize.height - COMPOSER_VERTICAL_GUTTER * 2
        };
    }

    return style;
};

export const shouldBeMaximized = (windowHeight: number) =>
    windowHeight - COMPOSER_VERTICAL_GUTTER - HEADER_HEIGHT < COMPOSER_HEIGHT - COMPOSER_SWITCH_MODE;
