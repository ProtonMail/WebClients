import isTruthy from '@proton/utils/isTruthy';

let current = 0;

export const generateUID = (prefix?: string) => `${prefix || 'id'}-${current++}`;
export const fakeEvent = <T>(value: T) => ({ target: { value } });

export const concatStringProp = (strings: (string | boolean | null | undefined)[] = []) => {
    return strings.filter(isTruthy).join(' ').trim();
};
