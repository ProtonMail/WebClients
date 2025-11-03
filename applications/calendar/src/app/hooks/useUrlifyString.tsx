import { useMemo } from 'react';

import { escapeInvalidHtmlTags, restrictedCalendarSanitize } from '@proton/shared/lib/calendar/sanitize';
import urlify, { type UrlifyOptions } from '@proton/shared/lib/calendar/urlify';

interface Props {
    text?: string;
    urlifyOptions?: UrlifyOptions;
}

export const useUrlifyString = ({ text, urlifyOptions }: Props) => {
    return useMemo(() => {
        if (!text) {
            return undefined;
        }

        const urlified = urlify(text, urlifyOptions);
        const escaped = escapeInvalidHtmlTags(urlified);
        return restrictedCalendarSanitize(escaped);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-62B59A
    }, [text]);
};
