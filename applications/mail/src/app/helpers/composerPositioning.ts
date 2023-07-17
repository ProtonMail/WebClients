import { getCustomSizingClasses } from '@proton/components';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';

export const MAX_ACTIVE_COMPOSER_DESKTOP = 3;
export const MAX_ACTIVE_COMPOSER_MOBILE = 1;

export const getComposerDimension = () => {
    const root = rootFontSize();
    return {
        width: 40 * root, // 640
        height: 40 * root, // 640
        gutter: root, // 16
        verticalGutter: 0.625 * root, // 10
        switchMode: 6.25 * root, // 100
        headerHeight: 5 * root, // 80
        appBarWidth: 2.8125 * root, // 45
    };
};

export type ComposerDimension = ReturnType<typeof getComposerDimension>;

const COMPOSER_NARROW_STYLES = {
    position: 'fixed',
    '--top-custom': 0,
    '--bottom-custom': 0,
    '--left-custom': 0,
    '--right-custom': 0,
    '--h-custom': 'auto',
    '--w-custom': 'auto',
};

export const computeLeftPosition = (
    { width, gutter }: ComposerDimension,
    index: number,
    count: number,
    windowWidth: number
) => {
    const neededWidth = width * count + gutter * (count + 1);

    let rightPosition: number;

    if (neededWidth < windowWidth) {
        rightPosition = width * index + gutter * (index + 1);
    } else {
        const widthToDivide = windowWidth - gutter * 2 - width;
        const share = widthToDivide / (count - 1);

        rightPosition = gutter + share * index;
    }

    // Prevent negative value
    if (rightPosition < 0) {
        rightPosition = gutter;
    }

    return windowWidth - width - rightPosition;
};

const computeHeight = ({ height, verticalGutter, headerHeight }: ComposerDimension, windowHeight: number) => {
    const maxHeight = windowHeight - verticalGutter - headerHeight;
    return maxHeight > height ? height : maxHeight;
};

interface ComputeComposerStyleOptions {
    composerDimension: ReturnType<typeof getComposerDimension>;
    // Composer index
    index: number;
    // Number of composer opened
    count: number;
    minimized: boolean;
    maximized: boolean;
    isNarrow: boolean;
    drawerOffset: number;
}

interface ComputeComposerStyleReturns {
    style: Record<string, string | number>;
    customClasses?: string;
}

export const computeComposerStyle = ({
    composerDimension,
    index,
    count,
    minimized,
    maximized,
    isNarrow,
    drawerOffset,
}: ComputeComposerStyleOptions): ComputeComposerStyleReturns => {
    // Use window.innerWidth and innerHeight instead of useWindowSize to avoid composer cut off issue (CLIENT-4854)
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth - drawerOffset;
    let style: Record<string, string | number> = {
        '--left-custom': `${computeLeftPosition(composerDimension, index, count, windowWidth)}px`,
        computeHeight: `${computeHeight(composerDimension, windowHeight)}px`,
    };

    if (isNarrow) {
        style = COMPOSER_NARROW_STYLES;
    } else if (minimized) {
        style['--h-custom'] = '35px';
    } else if (maximized) {
        const composerWidth = windowWidth - composerDimension.gutter - composerDimension.appBarWidth;
        style['--left-custom'] = `${windowWidth - composerWidth - composerDimension.gutter}px`;
        style['--w-custom'] = `${composerWidth}px`;
        style['--h-custom'] = `${windowHeight - composerDimension.verticalGutter * 2}px`;
    }

    return { style, customClasses: getCustomSizingClasses(style) };
};

export const shouldBeMaximized = (composerDimension: ComposerDimension, windowHeight: number) => {
    const { height, switchMode } = getComposerDimension();

    return windowHeight < height - switchMode;
};
