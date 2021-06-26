import isTruthy from '@proton/shared/lib/helpers/isTruthy';

let current = 0;

export const generateUID = (prefix?: string) => `${prefix || 'id'}-${current++}`;
export const fakeEvent = <T>(value: T) => ({ target: { value } });

export const concatStringProp = (strings: (string | boolean | null | undefined)[] = []) => {
    return strings.filter(isTruthy).join(' ').trim();
};

/**
 * Join CSS classes into string for className prop
 */
export const classnames = (classNames: (string | boolean | null | undefined)[] = []) => {
    return concatStringProp(classNames);
};
