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
            // We need to replace the # with ? to use URLSearchParams since it's not supported with #
            const searchParams = new URLSearchParams(decodedHash.replace(/#/g, '?'));
            const elementID = searchParams.get('elementID');
            const labelID = searchParams.get('labelID');

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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-87993B
    }, [location.hash, isSearch, history]);
};

export default useInboxDesktopElementId;
