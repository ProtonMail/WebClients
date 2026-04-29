import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { VaultMultiSelect } from '@proton/pass/components/Vault/VaultSelect';
import { useRequest } from '@proton/pass/hooks/useRequest';
import type { PersonalAccessToken } from '@proton/pass/lib/access-token/access-token.types';
import { getAccessTokenAccess, updateAccessTokenAccess } from '@proton/pass/store/actions';
import { selectAccessTokenGrants, selectWritableVaults } from '@proton/pass/store/selectors';
import { sortOn } from '@proton/pass/utils/fp/sort';

type Props = {
    token: PersonalAccessToken;
    onClose: () => void;
    onSaved: () => void;
};

export const ManageAccessModal: FC<Props> = ({ token, onClose, onSaved }) => {
    const tokenId = token.PersonalAccessTokenID;
    const writableVaults = useSelector(selectWritableVaults);
    const grants = useSelector(selectAccessTokenGrants(tokenId));

    const vaults = useMemo(() => [...writableVaults].sort(sortOn('createTime', 'ASC')), [writableVaults]);

    const fetchAccess = useRequest(getAccessTokenAccess, { loading: true });
    const update = useRequest(updateAccessTokenAccess, {
        onSuccess: onSaved,
    });

    const [selectedShareIds, setSelectedShareIds] = useState<Set<string>>(() => new Set());
    const [initialised, setInitialised] = useState(false);

    useEffect(() => fetchAccess.dispatch(tokenId), [tokenId]);

    /* Project the saga-loaded grants (keyed by VaultID) onto the user's vault
     * shareIds, then seed the selection on first arrival. */
    const grantedShareIds = useMemo(() => {
        const grantedVaultIds = new Set(grants.map((g) => g.VaultID));
        return new Set(vaults.filter((v) => grantedVaultIds.has(v.vaultId)).map((v) => v.shareId));
    }, [grants, vaults]);

    useEffect(() => {
        if (!fetchAccess.loading && !initialised) {
            setSelectedShareIds(new Set(grantedShareIds));
            setInitialised(true);
        }
    }, [fetchAccess.loading, initialised, grantedShareIds]);

    const toggleVault = (shareId: string) => {
        setSelectedShareIds((prev) => {
            const next = new Set(prev);
            if (next.has(shareId)) next.delete(shareId);
            else next.add(shareId);
            return next;
        });
    };

    const hasChanges = (() => {
        if (selectedShareIds.size !== grantedShareIds.size) return true;
        for (const id of selectedShareIds) if (!grantedShareIds.has(id)) return true;
        return false;
    })();

    const handleSave = () => {
        if (!hasChanges) {
            onClose();
            return;
        }
        update.dispatch({ tokenId, shareIds: Array.from(selectedShareIds) });
    };

    return (
        <PassModal open onClose={onClose} onReset={onClose} size="large">
            <ModalTwoHeader title={c('pass_2026: Title').t`Manage vault access`} />
            <ModalTwoContent>
                <p className="color-weak mt-0 mb-3">
                    {c('pass_2026: Info').t`Select the vaults "${token.Name}" can read. Changes apply immediately.`}
                </p>

                {fetchAccess.loading ? (
                    <div className="flex justify-center py-6">
                        <CircleLoader size="medium" />
                    </div>
                ) : (
                    <VaultMultiSelect vaults={vaults} selectedShareIds={selectedShareIds} onToggle={toggleVault} />
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose} disabled={update.loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button
                    color="norm"
                    onClick={handleSave}
                    loading={update.loading}
                    disabled={update.loading || fetchAccess.loading || !hasChanges}
                >
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
