import { useEffect } from 'react';
import { useHistory } from 'react-router';

import { setParamsInLocation } from 'proton-mail/helpers/mailboxUrl';

/**
 * URLs with a mailto protocol handler can be used to prefill the composer.
 * The mailto link is in the format `#mailto=mailto:...&subject=...&body=...`
 *
 */
const useInboxDesktopElementId = ({ isSearch }: { isSearch: boolean }) => {
    const history = useHistory();

    useEffect(() => {
        if (isSearch || !location.hash) {
            return;
        }

        const { hash } = location;

        try {
            const decodedHash = decodeURIComponent(hash);
            const hashArray = decodedHash.replace('#', '').split('&');
            const elementID = hashArray[0].replace('elementID=', '');
            const labelID = hashArray[1].replace('labelID=', '');
            if (elementID && labelID) {
                const cleanHistoryLocation = { ...history.location, hash: '' };
                const location = setParamsInLocation(cleanHistoryLocation, {
                    labelID,
                    elementID,
                });

                history.push(location);
            }
        } catch (e: any) {
            console.error(e);
        }
    }, [location.hash, isSearch, history]);
};

export default useInboxDesktopElementId;
