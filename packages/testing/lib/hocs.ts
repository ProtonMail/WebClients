import React, { ComponentType } from 'react';

import { WrapperComponent } from '@testing-library/react-hooks';

interface HOC<T> {
    (Component: ComponentType<T>): ComponentType<T>;
}

const reduceHOCs = <T>(hocs: HOC<T>[]): HOC<T> => hocs.reduce((reduced, next) => (c) => next(reduced(c)));

export const applyHOCs = <T extends JSX.IntrinsicAttributes>(...hocs: HOC<T>[]) => {
    /**
     * That's a small helper that ensures that in the following code withFeatures() can use API inside it:
     *
     * applyHOCs(withApi(), withFeatures())(MyComponent);
     */
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
