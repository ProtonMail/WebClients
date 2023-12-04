/// <reference types="react" />

// Block external access to auxiliary types
export {};

type Merge<T, U> = Omit<T, keyof U> & U;

type PropsWithAs<P, T extends React.ElementType> = P & { as?: T };

export type PolymorphicPropsWithoutRef<P, T extends React.ElementType> = Merge<
    T extends keyof JSX.IntrinsicElements
        ? React.PropsWithoutRef<JSX.IntrinsicElements[T]>
        : React.ComponentPropsWithoutRef<T>,
    PropsWithAs<P, T>
>;

export type PolymorphicPropsWithRef<P, T extends React.ElementType> = Merge<
    T extends keyof JSX.IntrinsicElements
        ? React.PropsWithRef<JSX.IntrinsicElements[T]>
        : React.ComponentPropsWithRef<T>,
    PropsWithAs<P, T>
>;
