import { useEffect } from 'react';

import { useOnMailTo } from '../containers/ComposeProvider';

/**
 * URLs with a mailto protocol handler can be used to prefill the composer.
 * The mailto link is in the format `#mailto=mailto:...&subject=...&body=...`
 *
 */
const useMailtoHash = ({ isSearch }: { isSearch: boolean }) => {
    const onMailTo = useOnMailTo();

    useEffect(() => {
        if (isSearch || !location.hash) {
            return;
        }

        const { hash } = location;

        try {
            const decodedHash = decodeURIComponent(hash);
            const mailtoIndex = decodedHash.indexOf('mailto=mailto:');
            if (mailtoIndex >= 0) {
                // We don't want to select the #mailto= but just the mailto: part
                const mailto = hash.substring(mailtoIndex + 'mailto='.length, hash.length);
                onMailTo(decodeURIComponent(mailto));
            }
        } catch (e: any) {
            console.error(e);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-15BF8C
    }, [location.hash, isSearch]);
};

export default useMailtoHash;
