import { Maybe } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export type BoundComputeStyles = ReturnType<typeof createStyleCompute>;

export const createStyleCompute: (
    el: HTMLElement
) => <T extends Maybe<(computedProperty: string) => any> = Maybe<(computedProperty: string) => any>>(
    property: string,
    transformer?: T
) => T extends (...args: any[]) => any ? ReturnType<T> : string = (el) => {
    const style = getComputedStyle(el);
    return (property, transformer) => {
        const value = style.getPropertyValue(property);
        return transformer?.(value) ?? value;
    };
};

export const pixelParser = (value: string) => parseInt(value.replace('px', ''), 10);
export const pixelEncoder = (value: number): string => `${value}px`;
export const pixelTransformer = (value: string, transformer: (value: number) => number): string =>
    pipe(pixelParser, transformer, pixelEncoder)(value);

export const getComputedHeight = (
    boundCompute: ReturnType<typeof createStyleCompute>,
    options: { asContentBox: boolean } = { asContentBox: true }
): { value: number; offset: { top: number; bottom: number } } => {
    const h = boundCompute('height', pixelParser);
    const isContentBox = boundCompute('box-sizing') === 'content-box';

    const pt = boundCompute('padding-top', pixelParser);
    const pb = boundCompute('padding-bottom', pixelParser);
    const bt = boundCompute('border-top', pixelParser);
    const bb = boundCompute('border-bottom', pixelParser);
    const offset = pt + bt + pb + bb;

    return {
        value: isContentBox ? h + offset : h - (options?.asContentBox ? 0 : offset),
        offset: {
            top: isContentBox || options?.asContentBox ? 0 : pt + bt,
            bottom: isContentBox || options?.asContentBox ? 0 : pb + bb,
        },
    };
};

export const getComputedWidth = (
    boundCompute: ReturnType<typeof createStyleCompute>,
    options: { asContentBox: boolean } = { asContentBox: true }
): { value: number; offset: { left: number; right: number } } => {
    const w = boundCompute('width', pixelParser);
    const isContentBox = boundCompute('box-sizing') === 'content-box';

    const pl = boundCompute('padding-left', pixelParser);
    const pr = boundCompute('padding-right', pixelParser);
    const bl = boundCompute('border-left', pixelParser);
    const br = boundCompute('border-right', pixelParser);
    const offset = pl + bl + pr + br;

    return {
        value: isContentBox ? w + offset : w - (options?.asContentBox ? 0 : offset),
        offset: {
            left: isContentBox || options?.asContentBox ? 0 : pl + bl,
            right: isContentBox || options?.asContentBox ? 0 : pr + br,
        },
    };
};
