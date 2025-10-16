import type { Filter, Sort } from '@proton/shared/lib/mail/search';

import { getElementContextIdentifier } from 'proton-mail/helpers/elements';

/**
 * Generate the context that can be used, for example, for total computation
 * @param labelID
 * @param conversationMode, default false
 * @param filter, default {}
 * @param sort, default { sort: 'Time', desc: true }
 * @returns the string context
 */
export const generateElementContextIdentifier = ({
    labelID,
    conversationMode = false,
    filter = {},
    sort = { sort: 'Time', desc: true },
}: {
    labelID: string;
    conversationMode?: boolean;
    filter?: Filter;
    sort?: Sort;
}) => {
    return getElementContextIdentifier({
        labelID,
        conversationMode,
        filter,
        sort,
    });
};
