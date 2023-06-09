import clsx from '@proton/utils/clsx';

export const getCustomSizingClasses = (style?: any): string => {
    if (!style) {
        return '';
    }
    return clsx([
        style['--height-custom'] !== undefined && 'h-custom',
        style['--width-custom'] !== undefined && 'w-custom',
        style['--top-custom'] !== undefined && 'top-custom',
        style['--right-custom'] !== undefined && 'right-custom',
        style['--left-custom'] !== undefined && 'left-custom',
        style['--bottom-custom'] !== undefined && 'bottom-custom',
    ]);
};
