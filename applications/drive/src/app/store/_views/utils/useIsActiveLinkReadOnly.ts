import { useEffect, useRef, useState } from 'react';

import { ShareType } from '../..';
import useActiveShare from '../../../hooks/drive/useActiveShare';
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

    const [isReadOnly, setIsReadOnly] = useState<boolean>();
    const [isLoading, setIsLoading] = useState<boolean>();
    const lastAc = useRef<AbortController>();

    useEffect(() => {
        setIsLoading(true);
        const ac = new AbortController();

        // Abort ongoing request to avoid fast meaningless shareType change
        lastAc.current?.abort();
        lastAc.current = ac;

        link.getLink(ac.signal, shareId, linkId)
            .then((link) => {
                if (link && shareType) {
                    setIsReadOnly(() => isLinkReadOnly(link, shareType));
                }
            })
            .catch(console.warn);
    }, [shareId, linkId, shareType]);

    useEffect(() => {
        if (isReadOnly !== undefined) {
            setIsLoading(false);
        }
    }, [isReadOnly]);

    return {
        isLoading: isLoading === true,
        isReadOnly,
    };
};
