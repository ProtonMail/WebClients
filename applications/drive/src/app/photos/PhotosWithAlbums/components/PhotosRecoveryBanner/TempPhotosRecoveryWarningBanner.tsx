import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { TopBanner } from '@proton/components/index';

import { useSharesStore } from '../../../../zustand/share/shares.store';

export const TempPhotosRecoveryWarningBanner = () => {
    const haveLockedPhotosShare = useSharesStore(useShallow((state) => state.haveLockedPhotosShare));
    if (!haveLockedPhotosShare()) {
        return null;
    }

    return (
        <TopBanner className="bg-warning">
            <p className="m-0 flex items-center justify-center">{c('Info')
                .t`We're upgrading photos to the new experience! During this transition, photo restoration is temporarily unavailable. Everything should be ready in a couple of days. We appreciate your understanding.`}</p>
        </TopBanner>
    );
};
