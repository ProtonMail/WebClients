const dangerousPatterns = [
    '__proto__',
    'constructor',
    'prototype',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__',
];

export const isValidMessageString = (jsonString: string): boolean => {
    const lowerStr = jsonString.toLowerCase();
    return !dangerousPatterns.some((pattern) => lowerStr.includes(pattern));
};
