import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router';

import { isCategoryLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { setParamsInLocation } from '../helpers/mailboxUrl';

/**
 * Deep links coming from the desktop app open an element in the mailbox.
 * The link is in the format `#labelID=...&elementID=...&messageID=...`
 *
 * The hash is read from react-router's location at render time, so the value is captured before the
 * category redirect effect (which runs first, being deeper in the tree) can rewrite the hash.
 */
const useInboxDesktopElementId = ({ isSearch }: { isSearch: boolean }) => {
    const history = useHistory();
    const { hash } = useLocation();

    useEffect(() => {
        if (isSearch || !hash) {
            return;
        }

        try {
            const decodedHash = decodeURIComponent(hash);
            // We need to replace the # with ? to use URLSearchParams since it's not supported with #
            const searchParams = new URLSearchParams(decodedHash.replace(/#/g, '?'));
            const elementID = searchParams.get('elementID');
            const labelID = searchParams.get('labelID');

            if (!elementID || !labelID) {
                return;
            }

            // Category labels are not routable on their own: we redirect to Inbox and select the
            // category through the URL hash. Without it the category redirect drops the elementID.
            const isCategory = isCategoryLabel(labelID);
            const humanCategory = isCategory ? LABEL_IDS_TO_HUMAN[labelID] : undefined;

            const cleanHistoryLocation = {
                ...history.location,
                hash: humanCategory ? `#category=${humanCategory}` : '',
            };

            const location = setParamsInLocation(cleanHistoryLocation, {
                labelID: isCategory ? MAILBOX_LABEL_IDS.INBOX : labelID,
                elementID,
            });

            history.push(location);
        } catch (e: any) {
            console.error(e);
        }
    }, [hash, isSearch, history]);
};

export default useInboxDesktopElementId;
