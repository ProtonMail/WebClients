import { type FC, useEffect } from 'react';

import { c } from 'ttag';

import accountImg from '@proton/pass/assets/protonpass-account.svg';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { AdaptiveModal } from '@proton/pass/components/Layout/Modal/AdaptiveModal';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { SpotlightMessage } from '@proton/pass/types';

export const PendingShareAccessModal: FC = () => {
    const { spotlight } = usePassCore();
    const { setPendingShareAccess } = useSpotlight();

    const onClose = () => {
        void spotlight.acknowledge(SpotlightMessage.PENDING_SHARE_ACCESS);
        setPendingShareAccess(false);
    };

    useEffect(
        /** Acknowledge PENDING_SHARE_ACCESS on unmount :
         * - Either the user manually closes modal
         * - Or, `SpotlightProvider` unmounts modal */
        () => onClose,
        []
    );

    return (
        <AdaptiveModal open onClose={onClose} size="small">
            <div className="flex flex-column items-center justify-center gap-6">
                <h3 className="text-bold w-3/4">{c('Title').t`Pending access to the shared data`}</h3>

                <img
                    src={accountImg}
                    alt="pending share access graphic"
                    className="w-3/5 max-w-custom"
                    style={{ '--max-w-custom': '15em' }}
                />

                <div className="text-md w-3/4">{c('Info')
                    .t`For security reasons, your access needs to be confirmed`}</div>
            </div>
        </AdaptiveModal>
    );
};
