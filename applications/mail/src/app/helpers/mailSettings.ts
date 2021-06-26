import { Location } from 'history';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { SHOW_IMAGES, VIEW_LAYOUT, VIEW_MODE } from 'proton-shared/lib/constants';

import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { extractSearchParameters } from './mailboxUrl';
import { isAlwaysMessageLabels } from './labels';

export const isColumnMode = ({ ViewLayout = VIEW_LAYOUT.COLUMN }: Partial<MailSettings> = {}) =>
    ViewLayout === VIEW_LAYOUT.COLUMN;

export const isConversationMode = (
    labelID = '',
    { ViewMode = VIEW_MODE.GROUP }: Partial<MailSettings> = {},
    location: Location
) => {
    const searchParams = extractSearchParameters(location);

    return (
        !isAlwaysMessageLabels(labelID) &&
        ViewMode === VIEW_MODE.GROUP &&
        !Object.entries(searchParams).some(([, value]) => typeof value !== 'undefined')
    );
};

export const hasShowEmbedded = ({ ShowImages = 0 }: Partial<MailSettings> = {}) =>
    hasBit(ShowImages, SHOW_IMAGES.EMBEDDED);

export const hasShowRemote = ({ ShowImages = 0 }: Partial<MailSettings> = {}) => hasBit(ShowImages, SHOW_IMAGES.REMOTE);
