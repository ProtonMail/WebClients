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
import { getAccessTokenGrants, updateAccessTokenAccess } from '@proton/pass/store/actions';
import { selectAccessTokenGrants, selectWritableVaults } from '@proton/pass/store/selectors';
import type { PersonalAccessTokenShareResponse, ShareId } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { sortOn } from '@proton/pass/utils/fp/sort';

type Props = {
    token: PersonalAccessToken;
    onClose: () => void;
};

const intoGrantedShareIDs = (grants: PersonalAccessTokenShareResponse[], shareIDs: Set<ShareId>): Set<ShareId> =>
    new Set(grants.map(prop('ParentShareID')).filter((shareID) => shareIDs.has(shareID)));

export const ManageAccessModal: FC<Props> = ({ token, onClose }) => {
    const tokenId = token.PersonalAccessTokenID;

    const writableVaults = useSelector(selectWritableVaults);
    const grants = useSelector(selectAccessTokenGrants(tokenId));
    const vaults = useMemo(() => [...writableVaults].sort(sortOn('createTime', 'ASC')), [writableVaults]);
    const shareIDs = useMemo(() => new Set(vaults.map(prop('shareId'))), [vaults]);
    const grantedShareIDs = useMemo(() => intoGrantedShareIDs(grants, shareIDs), [grants, shareIDs]);

    const [selectedShareIds, setSelectedShareIds] = useState<Set<ShareId>>(() => grantedShareIDs);

    const didChange = useMemo(() => {
        if (selectedShareIds.size !== grantedShareIDs.size) return true;
        for (const shareID of selectedShareIds) if (!grantedShareIDs.has(shareID)) return true;
        return false;
    }, [selectedShareIds, grantedShareIDs]);

    const fetchAccess = useRequest(getAccessTokenGrants, { loading: true });
    const updateAccess = useRequest(updateAccessTokenAccess, { onSuccess: onClose });

    const toggleVault = (shareId: string) => {
        setSelectedShareIds((prev) => {
            const next = new Set(prev);
            if (next.has(shareId)) next.delete(shareId);
            else next.add(shareId);
            return next;
        });
    };

    const handleSave = () => {
        if (didChange) updateAccess.dispatch({ tokenId, shareIds: Array.from(selectedShareIds) });
        else onClose();
    };

    useEffect(() => fetchAccess.dispatch(tokenId), [tokenId]);
    useEffect(() => setSelectedShareIds(grantedShareIDs), [grantedShareIDs]);

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
                <Button onClick={onClose} disabled={updateAccess.loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button
                    color="norm"
                    onClick={handleSave}
                    loading={updateAccess.loading}
                    disabled={updateAccess.loading || fetchAccess.loading || !didChange}
                >
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
