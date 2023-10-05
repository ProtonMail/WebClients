import React, { ComponentType } from 'react';

import { WrapperComponent } from '@testing-library/react-hooks';

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

        return (props: T & JSX.IntrinsicAttributes) => {
            return React.createElement<T>(WrappedComponent, props);
        };
    };
};

export const hookWrapper = <T extends JSX.IntrinsicAttributes>(...hocs: HOC<T>[]): WrapperComponent<T> => {
    return reduceHOCs(hocs)(({ children }) => React.createElement('', { children }));
};

export const componentWrapper = <T extends JSX.IntrinsicAttributes>(
    ...hocs: HOC<T>[]
): React.JSXElementConstructor<{ children: React.ReactElement }> => {
    return reduceHOCs(hocs)((props) => props.children as any) as any;
};
