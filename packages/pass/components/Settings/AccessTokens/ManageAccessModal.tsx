import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { useMemoSelector } from '../../../hooks/useMemoSelector';
import { useRequest } from '../../../hooks/useRequest';
import {
    type PatUiGrantRole,
    patGrantSelectionEquals,
    patGrantSelectionFromAccessGrants,
} from '../../../lib/access-token/access-token.grants';
import type { PersonalAccessToken } from '../../../lib/access-token/access-token.types';
import { getAccessTokenGrants, updateAccessTokenAccess } from '../../../store/actions/creators/access-token';
import { selectAccessTokenGrantsOrEmpty } from '../../../store/selectors/access-token';
import { selectWritableVaults } from '../../../store/selectors/shares';
import type { ShareId } from '../../../types/crypto/pass-types';
import { ShareRole } from '../../../types/data/shares';
import { prop } from '../../../utils/fp/lens';
import { sortOn } from '../../../utils/fp/sort';
import { PassModal } from '../../Layout/Modal/PassModal';
import { VaultPatGrantSelect } from './VaultPatGrantSelect';

type Props = {
    token: PersonalAccessToken;
    onClose: () => void;
};

export const ManageAccessModal: FC<Props> = ({ token, onClose }) => {
    const tokenId = token.PersonalAccessTokenID;

    const writableVaults = useSelector(selectWritableVaults);
    const grants = useMemoSelector(selectAccessTokenGrantsOrEmpty, [tokenId]);
    const vaults = useMemo(() => [...writableVaults].sort(sortOn('createTime', 'ASC')), [writableVaults]);
    const manageableShareIds = useMemo(() => new Set(vaults.map(prop('shareId'))), [vaults]);

    const savedSelection = useMemo(
        () => patGrantSelectionFromAccessGrants(grants, manageableShareIds),
        [grants, manageableShareIds]
    );

    const [selection, setSelection] = useState<Map<ShareId, ShareRole>>(() => new Map(savedSelection));

    const didChange = useMemo(() => !patGrantSelectionEquals(selection, savedSelection), [selection, savedSelection]);

    const fetchAccess = useRequest(getAccessTokenGrants, { loading: true });
    const updateAccess = useRequest(updateAccessTokenAccess, { onSuccess: onClose });

    const toggleVault = (shareId: string) => {
        setSelection((prev) => {
            const next = new Map(prev);
            if (next.has(shareId)) next.delete(shareId);
            else next.set(shareId, savedSelection.get(shareId) ?? ShareRole.READ);
            return next;
        });
    };

    const setVaultRole = (shareId: string, role: PatUiGrantRole) => {
        setSelection((prev) => new Map(prev).set(shareId, role));
    };

    const handleSave = () => {
        if (didChange) {
            updateAccess.dispatch({
                tokenId,
                grants: Array.from(selection, ([shareId, role]) => ({ shareId, role })),
            });
        } else onClose();
    };

    useEffect(() => fetchAccess.dispatch(tokenId), [tokenId]);
    useEffect(() => setSelection(new Map(savedSelection)), [savedSelection]);

    return (
        <PassModal open onClose={onClose} onReset={onClose} size="large" enableCloseWhenClickOutside>
            <ModalTwoHeader title={c('Title').t`Manage vault access`} />
            <ModalTwoContent>
                <p className="color-weak mt-0 mb-3 text-break">
                    {c('Info')
                        .t`Choose vaults for "${token.Name}" and set Viewer or Editor for each. Manager access (if any) is shown read-only.`}
                </p>

                {fetchAccess.loading ? (
                    <div className="flex justify-center py-6">
                        <CircleLoader size="medium" />
                    </div>
                ) : (
                    <VaultPatGrantSelect
                        vaults={vaults}
                        grantsByShareId={selection}
                        onToggle={toggleVault}
                        onRoleChange={setVaultRole}
                    />
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
