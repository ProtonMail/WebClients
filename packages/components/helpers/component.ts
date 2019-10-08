import React, { isValidElement } from 'react';

let current = 0;

export const generateUID = (prefix: string) => `${prefix || 'id'}-${current++}`;
export const fakeEvent = <T>(value: T) => ({ target: { value } });

/**
 * Given a list of components, nest each one in order starting with the initial children.
 */
export const nestChildren = (components: React.ReactNode[] = [], initialChildren: React.ReactNode): React.ReactNode => {
    return components.reverse().reduce((acc, Component) => {
        if (isValidElement(Component)) {
            return React.cloneElement(Component, [], acc);
        }
    }, initialChildren);
};

/**
 * Join CSS classes into string for className prop
 */
export const classnames = (classNames: (string | boolean | null | undefined)[] = []) => {
    return classNames
        .filter(Boolean)
        .join(' ')
        .trim();
};
