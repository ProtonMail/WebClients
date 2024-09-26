import isTruthy from '@proton/utils/isTruthy';

export const concatStringProp = (strings: (string | boolean | null | undefined)[] = []) => {
    return strings.filter(isTruthy).join(' ').trim();
};
