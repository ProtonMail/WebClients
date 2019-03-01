let current = 0

export const generateUID = (prefix) => `${prefix || 'id'}-${current++}`;
export const getClasses = (defaultClass = '', classNames = '') => `${defaultClass.trim()}  ${classNames.trim()}`;
export const fakeEvent = (value) => ({ target: { value }});
