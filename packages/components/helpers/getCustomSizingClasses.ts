import { classnames } from './component';

export const getCustomSizingClasses = (style?: any) => {
    if (!style) {
        return '';
    }
    return classnames([
        style['--height-custom'] && 'h-custom',
        style['--width-custom'] && 'w-custom',
        style['--top-custom'] && 'top-custom',
        style['--right-custom'] && 'right-custom',
        style['--left-custom'] && 'left-custom',
        style['--bottom-custom'] && 'bottom-custom',
    ]);
};
