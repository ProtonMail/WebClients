import { ComponentProps, ElementType, forwardRef, ReactElement, Ref } from 'react';

// from: https://github.com/kripod/react-polymorphic-box

export type BoxOwnProps<E extends ElementType = ElementType> = {
    as?: E;
};

export type BoxProps<E extends ElementType> = BoxOwnProps<E> & Omit<ComponentProps<E>, keyof BoxOwnProps>;

const defaultElement = 'div';

const BoxComponent = (props: BoxOwnProps, ref: Ref<Element>) => {
    const { as: Element = defaultElement, ...rest } = props;
    return <Element ref={ref} {...rest} />;
};

export const Box: <E extends ElementType = typeof defaultElement>(props: BoxProps<E>) => ReactElement | null =
    forwardRef(BoxComponent);

export type PolymorphicComponentProps<E extends ElementType, P> = P & BoxProps<E>;

export type PolymorphicComponent<P, D extends ElementType = 'div'> = <E extends ElementType = D>(
    props: PolymorphicComponentProps<E, P>
) => ReactElement | null;
