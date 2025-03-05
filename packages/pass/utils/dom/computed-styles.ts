import type { Identity } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export interface StyleParser {
    <T extends (value: string, node: HTMLElement) => any = Identity<string>>(
        prop: string,
        transform?: T
    ): ReturnType<T>;
    node: HTMLElement;
}

export const createStyleParser = (node: HTMLElement): StyleParser => {
    const style = getComputedStyle(node);

    const parser: StyleParser = (property, transformer) => {
        const value = style.getPropertyValue(property);
        return transformer?.(value, node) ?? value;
    };

    parser.node = node;
    return parser;
};

export const pixelParser = (value: string) => parseInt(value.replace('px', ''), 10);
export const pixelEncoder = (value: number): string => `${value}px`;
export const pixelTransformer = (value: string, transformer: (value: number) => number): string =>
    pipe(pixelParser, transformer, pixelEncoder)(value);

const getOffsetFor = (dir: 'top' | 'left' | 'bottom' | 'right') => (parser: StyleParser) => {
    const padding = parser(`padding-${dir}`, pixelParser);
    const border = parser(`border-${dir}`, pixelParser);
    return padding + border;
};

export const getOffsetTop = getOffsetFor('top');
export const getOffsetBottom = getOffsetFor('bottom');
export const getOffsetLeft = getOffsetFor('left');
export const getOffsetRight = getOffsetFor('right');

/* certain target nodes will be have their height/width set to 'auto',
 * in this case fallback to the element's `offsetHeight` */
const readSize = (value: string, node: HTMLElement) =>
    value === 'auto' || !value ? node.offsetHeight : pixelParser(value);

export const getComputedHeight = (
    parser: StyleParser,
    mode: 'inner' | 'outer'
): { value: number; offset: { top: number; bottom: number } } => {
    const isContentBox = parser('box-sizing') === 'content-box';
    const height = parser('height', readSize);
    const offsetTop = getOffsetTop(parser);
    const offsetBottom = getOffsetBottom(parser);
    const offset = offsetTop + offsetBottom;

    return {
        value: isContentBox ? height + (mode === 'outer' ? offset : 0) : height - (mode === 'inner' ? offset : 0),
        offset: {
            top: mode === 'outer' ? 0 : offsetTop,
            bottom: mode === 'outer' ? 0 : offsetBottom,
        },
    };
};

export const getComputedWidth = (
    parser: StyleParser,
    mode: 'inner' | 'outer'
): { value: number; offset: { left: number; right: number } } => {
    const isContentBox = parser('box-sizing') === 'content-box';
    const width = parser('width', readSize);
    const offsetLeft = getOffsetLeft(parser);
    const offsetRight = getOffsetRight(parser);
    const offset = offsetLeft + offsetRight;

    return {
        value: isContentBox ? width + (mode === 'outer' ? offset : 0) : width - (mode === 'inner' ? offset : 0),
        offset: {
            left: mode === 'outer' ? 0 : offsetLeft,
            right: mode === 'outer' ? 0 : offsetRight,
        },
    };
};
