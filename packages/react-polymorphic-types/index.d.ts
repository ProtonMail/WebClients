import type {
    ComponentPropsWithRef,
    ComponentPropsWithoutRef,
    ElementType,
    ExoticComponent,
    ForwardRefExoticComponent,
    JSX,
    PropsWithRef,
    PropsWithoutRef,
    ReactNode,
} from 'react';

type Merge<T, U> = Omit<T, keyof U> & U;

type PropsWithAs<P, T extends ElementType> = P & { as?: T };
type UnknownProps<P> = P & { [key: string]: unknown };

type ExtractPropsWithRef<T> = T extends keyof JSX.IntrinsicElements
    ? PropsWithRef<JSX.IntrinsicElements[T]>
    : ComponentPropsWithRef<T>;

type ExtractPropsWithoutRef<T> = T extends keyof JSX.IntrinsicElements
    ? PropsWithoutRef<JSX.IntrinsicElements[T]>
    : ComponentPropsWithoutRef<T>;

type PolymorphicRefForwardingFunction<P, T extends ElementType> = <InstanceT extends ElementType = T>(
    props: PolymorphicPropsWithRef<P, InstanceT>
) => ReactNode;

type PolymorphicExoticComponent<P = {}, T extends ElementType> = Merge<
    ExoticComponent<UnknownProps<P>>,
    PolymorphicRefForwardingFunction<P, T>
>;

export type PolymorphicPropsWithoutRef<P, T extends ElementType> = Merge<ExtractPropsWithoutRef<T>, PropsWithAs<P, T>>;
export type PolymorphicPropsWithRef<P, T extends ElementType> = Merge<ExtractPropsWithRef<T>, PropsWithAs<P, T>>;

export type PolymorphicForwardRefExoticComponent<P, T extends ElementType> = Merge<
    ForwardRefExoticComponent<UnknownProps<P>>,
    PolymorphicExoticComponent<P, T>
>;
