import { useEffect, useCallback } from 'react';
import { c } from 'ttag';

import { InlineLinkButton, TopBanner, useModals, useAddressesKeys, useUser, useLoading } from '@proton/components';
import { Address, DecryptedKey } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import FilesRecoveryModal from './FileRecovery/FilesRecoveryModal';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import useDrive from '../../hooks/drive/useDrive';
import useResolveLockedSharesFlow from './KeyReactivation/useResolveLockedSharesFlow';

interface Props {
    onClose: () => void;
}

const LockedVolumesBanner = ({ onClose }: Props) => {
    const cache = useDriveCache();
    const { createModal } = useModals();
    const [User] = useUser();
    const [addressesKeys] = useAddressesKeys();
    const [loading, withLoading] = useLoading(true);
    const { getSharesReadyToRestore } = useDrive();
    const { openKeyReactivationModal } = useResolveLockedSharesFlow({ onSuccess: onClose, onError: onClose });

    const getReadyToRestoreData = useCallback(
        (
            addressesKeys: {
                address: Address;
                keys: DecryptedKey[];
            }[]
        ) => {
            const possibleKeys = addressesKeys.reduce((result: DecryptedKey[], { address, keys }) => {
                return [
                    ...result,
                    ...address.Keys.map((nonPrimaryKey) => keys.find((key) => key.ID === nonPrimaryKey.ID)).filter(
                        isTruthy
                    ),
                ];
            }, []);

            const lockedShareIds = cache.get.lockedShares.map(({ ShareID }) => ShareID);
            return getSharesReadyToRestore(possibleKeys, lockedShareIds).then(cache.setSharesReadyToRestore);
        },
        [cache.get.lockedShares]
    );

    useEffect(() => {
        if (addressesKeys) {
            withLoading(getReadyToRestoreData(addressesKeys)).catch(console.error);
        }
    }, [User.Email, addressesKeys, getReadyToRestoreData]);

    const StartRecoveryButton = (
        <InlineLinkButton
            key="file-recovery-more"
            onClick={() => {
                createModal(<FilesRecoveryModal lockedShareList={cache.sharesReadyToRestore} />);
            }}
        >
            {c('Info').t`More`}
        </InlineLinkButton>
    );

    const KeyReactivationButton = (
        <InlineLinkButton
            key="key-reactivation"
            onClick={openKeyReactivationModal}
            data-test-id="recovery-banner:key-reactivation-button"
        >
            {c('Info').t`Learn more`}
        </InlineLinkButton>
    );

    const reactivateMessage = c('Info')
        .jt`Your files are no longer accessible due to a password reset. Re-upload the old encryption key to regain the access. ${KeyReactivationButton}`;
    const recoveryMessage = c('Info')
        .jt`Some of your files are no longer accessible. Restore the access to your files. ${StartRecoveryButton}`;

    return !loading && cache.get.lockedShares.length ? (
        <TopBanner className="bg-danger" onClose={onClose}>
            {cache.sharesReadyToRestore.length ? recoveryMessage : reactivateMessage}
        </TopBanner>
    ) : null;
};

export default LockedVolumesBanner;
