import { useEffect, useState } from 'react';

import { ShareType } from '../..';
import { useShare } from '../../_shares';

export const useShareType = (shareId: string) => {
    const [shareType, setShareType] = useState<ShareType>();
    const { getShare } = useShare();

    useEffect(() => {
        const ac = new AbortController();
        getShare(ac.signal, shareId)
            .then((share) => {
                setShareType(share.type);
            })
            .catch(reportError);
    }, [shareId]);

    return shareType;
};
