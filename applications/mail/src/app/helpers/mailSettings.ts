import { Location } from 'history';
import { VIEW_LAYOUT, VIEW_MODE } from 'proton-shared/lib/constants';

import { extractSearchParameters } from './mailboxUrl';
import { isAlwaysMessageLabels } from './labels';

interface MailSettings {
    ViewLayout?: number;
    ViewMode?: number;
}

export const isColumnMode = ({ ViewLayout = VIEW_LAYOUT.COLUMN }: MailSettings = {}) =>
    ViewLayout === VIEW_LAYOUT.COLUMN;

export const isConversationMode = (
    labelID = '',
    { ViewMode = VIEW_MODE.GROUP }: MailSettings = {},
    location: Location
) => {
    const searchParams = extractSearchParameters(location);

    return (
        !isAlwaysMessageLabels(labelID) &&
        ViewMode === VIEW_MODE.GROUP &&
        !Object.entries(searchParams).some(([, value]) => typeof value !== 'undefined')
    );
};
