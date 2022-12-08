import { useEffect, useState } from 'react';

import { ShareType } from '../..';
import { sendErrorReport } from '../../../utils/errorHandling';
import { useShare } from '../../_shares';

/**
 * Returns following values:
 * * `ShareType` - type of the share
 * * `undefined` – loading/not set yet
 * * `null` - failed to identify shareType
 */
export const useShareType = (shareId: string) => {
    const [shareType, setShareType] = useState<ShareType | undefined | null>(undefined);
    const { getShare } = useShare();

    useEffect(() => {
        setShareType(undefined);
        const ac = new AbortController();
        getShare(ac.signal, shareId)
            .then((share) => {
                setShareType(share.type);
            })
            .catch((e) => {
                sendErrorReport(e);
                setShareType(null);
            });
    }, [shareId]);

    return shareType;
};
