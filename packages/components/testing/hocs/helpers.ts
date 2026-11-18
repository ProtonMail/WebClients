import type { ComponentType, JSX, ReactNode } from 'react';
import { Fragment, createElement } from 'react';

interface HOC<T> {
    (Component: ComponentType<T>): ComponentType<T>;
}

const reduceHOCs = <T>(hocs: HOC<T>[]): HOC<T> => hocs.reduce((reduced, next) => (c) => next(reduced(c)));

/**
 * A helper function to apply multiple higher order components to a component.
 * It's useful to mock context providers.
 */
export const applyHOCs = <T extends JSX.IntrinsicAttributes>(...hocs: HOC<T>[]) => {
    const reversedHocs = [...hocs].reverse();
    const reducedHoc = reduceHOCs(reversedHocs);

    return (Component: ComponentType<T>) => {
        const WrappedComponent = reducedHoc(Component);

        const HOC = (props: T & JSX.IntrinsicAttributes) => {
            return createElement<T>(WrappedComponent, props);
        };

        return HOC;
    };
};

export const hookWrapper = <
    T extends JSX.IntrinsicAttributes & {
        children?: ReactNode;
    },
>(
    ...hocs: HOC<T>[]
): ComponentType<T> => {
    return reduceHOCs(hocs)(({ children }) => createElement(Fragment, null, children));
};

export const componentWrapper = <T extends JSX.IntrinsicAttributes & { children?: ReactNode }>(
    ...hocs: HOC<T>[]
): React.JSXElementConstructor<{ children: ReactNode }> => {
    return reduceHOCs(hocs)((props) => props.children as any) as any;
};
