import { useEffect, useRef, useState } from 'react';

import { ShareType } from '../..';
import useActiveShare from '../../../hooks/drive/useActiveShare';
import { isIgnoredError, sendErrorReport } from '../../../utils/errorHandling';
import { DecryptedLink, useLink } from '../../_links';
import { useShareType } from './useShareType';

export const isLinkReadOnly = (link: DecryptedLink, shareType: ShareType) => {
    const isRootLink = !link.parentLinkId;
    return shareType === ShareType.device && isRootLink;
};

export const useIsActiveLinkReadOnly = () => {
    const { activeFolder } = useActiveShare();
    const { shareId, linkId } = activeFolder;
    const shareType = useShareType(shareId);
    const link = useLink();

    const [isReadOnly, setIsReadOnly] = useState<boolean | undefined>(undefined);
    const ongoingRequestAc = useRef<AbortController>();

    useEffect(() => {
        const ac = new AbortController();

        // Abort ongoing request to avoid fast meaningless shareType change
        ongoingRequestAc.current?.abort();
        ongoingRequestAc.current = ac;
        setIsReadOnly(undefined);

        if (shareType) {
            link.getLink(ac.signal, shareId, linkId)
                .then((link) => {
                    setIsReadOnly(isLinkReadOnly(link, shareType));
                })
                .catch((e) => {
                    sendErrorReport(e);

                    // Ignore errors caused by .abort()
                    if (!isIgnoredError(e)) {
                        // Assume that a link isn't read-only,
                        // as it's the majority of all cases.
                        setIsReadOnly(false);
                    }
                })
                .finally(() => {
                    ongoingRequestAc.current = undefined;
                });
        } else if (shareType === null) {
            // Couldn't load share info, assuming it isn't read-only
            setIsReadOnly(false);
        }
    }, [linkId, shareType]);

    return {
        isLoading: isReadOnly === undefined,
        isReadOnly,
    };
};
