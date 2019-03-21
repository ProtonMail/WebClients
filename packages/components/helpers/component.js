import React from 'react';

let current = 0;

export const generateUID = (prefix) => `${prefix || 'id'}-${current++}`;
export const getClasses = (defaultClass = '', classNames = '') => `${defaultClass.trim()}  ${classNames.trim()}`;
export const fakeEvent = (value) => ({ target: { value } });

/**
 * Given a list of components, nest each one in order starting with the initial children.
 * @param {Array} components
 * @param {node} initialChildren
 * @return {node}
 */
export const nestChildren = (components = [], initialChildren) => {
    const nest = (element, children) => React.cloneElement(element, [], children);
    return components.reverse().reduce((acc, Component) => {
        return nest(Component, acc);
    }, initialChildren);
};
