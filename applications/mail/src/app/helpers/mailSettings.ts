import { Location } from 'history';

import { VIEW_LAYOUT, VIEW_MODE } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';

import { hasAttachmentsFilter, isSearch } from './elements';
import { isAlwaysMessageLabels } from './labels';
import { extractSearchParameters, filterFromUrl } from './mailboxUrl';

export const isColumnMode = ({ ViewLayout = VIEW_LAYOUT.COLUMN }: Partial<MailSettings> = {}) =>
    ViewLayout === VIEW_LAYOUT.COLUMN;

export const isConversationMode = (
    labelID = '',
    { ViewMode = VIEW_MODE.GROUP }: Partial<MailSettings> = {},
    location?: Location
) => {
    const searchParams = location ? extractSearchParameters(location) : {};
    const filter = location ? filterFromUrl(location) : undefined;

    return (
        !isAlwaysMessageLabels(labelID) &&
        ViewMode === VIEW_MODE.GROUP &&
        !isSearch(searchParams) &&
        !hasAttachmentsFilter(filter)
    );
};
