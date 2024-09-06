export const normalize = (value = '', removeDiacritics = false) => {
    let normalized = value.toLowerCase().trim();
    if (removeDiacritics) {
        normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return normalized;
};

export const replaceLineBreak = (content = '') => content.replace(/(?:\r\n|\r|\n)/g, '<br />');

export const toCRLF = (str: string) => str.replace(/\n/g, '\r\n');

export const addPlus = ([first = '', ...rest] = []) => {
    return [first, rest.length && `+${rest.length}`].filter(Boolean).join(', ');
};

export const DEFAULT_TRUNCATE_OMISSION = '…';

/**
 * Given a maximum number of characters to capture from a string at the start and end of it,
 * truncate the string by adding omission if too long. If only a maximum number of characters
 * is passed, the string is truncated by adding omission in the middle of it if too long
 */
export const truncateMore = ({
    string,
    charsToDisplay,
    charsToDisplayStart = 0,
    charsToDisplayEnd = 0,
    omission = '…',
    skewEnd = false,
}: {
    string: string;
    charsToDisplay?: number;
    charsToDisplayStart?: number;
    charsToDisplayEnd?: number;
    omission?: string;
    skewEnd?: boolean;
}): string => {
    if (string.length === 0) {
        return string;
    }

    if (charsToDisplay !== undefined) {
        // truncate symmetrically
        const visibleChars = charsToDisplay - omission.length;
        const charsToDisplayStart = skewEnd ? Math.floor(visibleChars / 2) : Math.ceil(visibleChars / 2);
        const charsToDisplayEnd = visibleChars - charsToDisplayStart;

        return truncateMore({ string, charsToDisplayStart, charsToDisplayEnd, omission });
    }

    if (string.length <= charsToDisplayStart + charsToDisplayEnd + omission.length) {
        return string;
    }

    const strBegin = string.substring(0, charsToDisplayStart);
    const strEnd = string.substring(string.length - charsToDisplayEnd, string.length);

    return strBegin + omission + strEnd;
};

export const truncatePossiblyQuotedString = (string: string, charsToDisplay: number) => {
    const match = string.match(/^"(.+)"$/);

    if (!match) {
        return truncateMore({ string, charsToDisplay });
    }

    const [, quotedString] = match;

    return `"${truncateMore({ string: quotedString, charsToDisplay: charsToDisplay - 2 })}"`;
};

export const getInitials = (fullName = '') => {
    const [first, ...rest] = fullName
        .replace(/\s{2,}/g, ' ')
        .split(' ')
        .filter((word = '') => !/^[.,/#!$@%^&*;:{}=\-_`~()]/g.test(word));
    const last = rest[rest.length - 1];

    const initials = [first, last]
        .filter(Boolean)
        .map((letter = '') => [...letter.toUpperCase()][0]) // We use the spread operator to support Unicode characters
        .join('');

    if (!initials) {
        return '?';
    }

    return initials;
};

export const hasProtonDomain = (email = '') => {
    return /@(protonmail\.(com|ch)|proton\.(me|ch)|pm\.me|)$/i.test(email);
};

const getMatchingCharacters = (string: string, substring: string) => {
    let i;
    for (i = 0; i < substring.length; ++i) {
        if (string[i] !== substring[i]) {
            return i;
        }
    }
    return i > 0 ? i : 0;
};

export const findLongestMatchingIndex = (strings: string[] = [], substring = '') => {
    let max = 0;
    let i = -1;

    strings.forEach((string, idx) => {
        const numberOfMatches = getMatchingCharacters(string, substring);
        if (numberOfMatches > max) {
            max = numberOfMatches;
            i = idx;
        }
    });

    return i;
};

export const stripLeadingSlash = (str: string) => str.replace(/^\/+/g, '');
export const stripTrailingSlash = (str: string) => str.replace(/\/+$/g, '');
export const stripLeadingAndTrailingSlash = (str: string) => str.replace(/^\/+|\/+$/g, '');

export const removeDiacritics = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Replace LTR and RTL override unicode chars which can lead to security issues on filenames
 * 202D and 202E should be the only unicode chars concerned
 * https://jira.protontech.ch/browse/SEC-644
 */
export const rtlSanitize = (str: string) => {
    return str.replace(/[\u202D\u202E]/g, '_');
};

export const removeHTMLComments = (str: string) => {
    return str.replace(/<!--[\s\S]*?-->/g, '');
};
