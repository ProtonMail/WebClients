import type { ComponentType } from 'react';
import { createElement } from 'react';

interface HOC<T> {
    (Component: ComponentType<T>): ComponentType<T>;
}

const reduceHOCs = <T>(hocs: HOC<T>[]): HOC<T> => hocs.reduce((reduced, next) => (c) => next(reduced(c)));

export const applyHOCs = <T extends JSX.IntrinsicAttributes>(...hocs: HOC<T>[]) => {
    const reversedHocs = [...hocs].reverse();
    const reducedHoc = reduceHOCs(reversedHocs);

    return (Component: ComponentType<T>) => {
        const WrappedComponent = reducedHoc(Component);

        return (props: T & JSX.IntrinsicAttributes) => createElement<T>(WrappedComponent, props);
    };
};
