import getRandomString, { DEFAULT_LOWERCASE_CHARSET } from '@proton/utils/getRandomString';
import isTruthy from '@proton/utils/isTruthy';

export const getAddressSuggestedLocalPart = (
    groupName: string,
    organizationName: string | undefined = undefined,
    generateSuffix: boolean = false
) => {
    const randomSuffix = generateSuffix ? getRandomString(4, DEFAULT_LOWERCASE_CHARSET) : '';
    return [organizationName, groupName, randomSuffix]
        .filter(isTruthy)
        .join(' ')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_\.\s+]/g, '')
        .replace(/\s+/g, '-');
};
