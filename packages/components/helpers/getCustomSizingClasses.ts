import { classnames } from './component';

export const getCustomSizingClasses = (style?: any) => {
    if (!style) {
        return '';
    }
    return classnames([
        style['--height-custom'] !== undefined && 'h-custom',
        style['--width-custom'] !== undefined && 'w-custom',
        style['--top-custom'] !== undefined && 'top-custom',
        style['--right-custom'] !== undefined && 'right-custom',
        style['--left-custom'] !== undefined && 'left-custom',
        style['--bottom-custom'] !== undefined && 'bottom-custom',
    ]);
};
