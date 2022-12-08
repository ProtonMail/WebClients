import { useEffect, useRef, useState } from 'react';

import { ShareType } from '../..';
import useActiveShare from '../../../hooks/drive/useActiveShare';
import { sendErrorReport } from '../../../utils/errorHandling';
import { DecryptedLink, useLink } from '../../_links';
import { useShareType } from './useShareType';

const isLinkReadOnly = (link: DecryptedLink, shareType: ShareType) => {
    const isRootLink = !link.parentLinkId;
    return shareType === ShareType.device && isRootLink;
};

export const useIsActiveLinkReadOnly = () => {
    const { activeFolder } = useActiveShare();
    const { shareId, linkId } = activeFolder;
    const shareType = useShareType(shareId);
    const link = useLink();

    const [isReadOnly, setIsReadOnly] = useState<boolean | undefined>(undefined);
    const lastAc = useRef<AbortController>();

    useEffect(() => {
        const ac = new AbortController();

        // Abort ongoing request to avoid fast meaningless shareType change
        lastAc.current?.abort();
        lastAc.current = ac;

        if (shareType) {
            link.getLink(ac.signal, shareId, linkId)
                .then((link) => {
                    setIsReadOnly(isLinkReadOnly(link, shareType));
                })
                .catch((e) => {
                    sendErrorReport(e);
                    setIsReadOnly(true);
                });
        } else {
            setIsReadOnly(true);
        }
    }, [shareId, linkId, shareType]);

    return {
        isLoading: isReadOnly === undefined,
        isReadOnly,
    };
};
