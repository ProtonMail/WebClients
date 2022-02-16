import { useEffect } from 'react';
import { c } from 'ttag';

import { InlineLinkButton, TopBanner, useModals, useLoading } from '@proton/components';

import { useLockedVolume } from '../../store';
import FilesRecoveryModal from './FileRecovery/FilesRecoveryModal';
import useResolveLockedSharesFlow from './KeyReactivation/useResolveLockedSharesFlow';

interface Props {
    onClose: () => void;
}

const LockedVolumesBanner = ({ onClose }: Props) => {
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading(true);
    const { isReadyForPreparation, prepareVolumesForRestore, hasLockedVolumes, hasVolumesForRestore } =
        useLockedVolume();

    const { openKeyReactivationModal } = useResolveLockedSharesFlow({
        onSuccess: () => {
            prepareVolumesForRestore(new AbortController().signal).catch(console.error);
        },
        onError: onClose,
    });

    useEffect(() => {
        // Prepare volumes only if there are locked volumes already loaded
        // so we dont set loading to false too soon in which case we would
        // show banner about locked volumes for a brief moment before we
        // display the final banner about option to recover files.
        if (isReadyForPreparation) {
            withLoading(prepareVolumesForRestore(new AbortController().signal)).catch(console.error);
        }
    }, [isReadyForPreparation, prepareVolumesForRestore]);

    const StartRecoveryButton = (
        <InlineLinkButton
            key="file-recovery-more"
            onClick={() => {
                createModal(<FilesRecoveryModal />);
            }}
        >
            {c('Info').t`More`}
        </InlineLinkButton>
    );

    const KeyReactivationButton = (
        <InlineLinkButton
            key="key-reactivation"
            onClick={openKeyReactivationModal}
            data-testid="recovery-banner:key-reactivation-button"
        >
            {c('Info').t`Learn more`}
        </InlineLinkButton>
    );

    const reactivateMessage = c('Info')
        .jt`Your files are no longer accessible due to a password reset. Re-upload the old encryption key to regain the access. ${KeyReactivationButton}`;
    const recoveryMessage = c('Info')
        .jt`Some of your files are no longer accessible. Restore the access to your files. ${StartRecoveryButton}`;

    return !loading && hasLockedVolumes ? (
        <TopBanner className="bg-danger" onClose={onClose}>
            {hasVolumesForRestore ? recoveryMessage : reactivateMessage}
        </TopBanner>
    ) : null;
};

export default LockedVolumesBanner;
