import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Checkbox from '@proton/components/components/input/Checkbox';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useNotifications from '@proton/components/hooks/useNotifications';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import {
    grantPersonalAccessTokenAccess,
    listPersonalAccessTokenAccess,
    revokePersonalAccessTokenAccess,
} from '@proton/pass/lib/access-token/access-token.requests';
import type { PersonalAccessToken } from '@proton/pass/lib/access-token/access-token.types';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { selectWritableVaults } from '@proton/pass/store/selectors';
import { ShareRole, ShareType } from '@proton/pass/types';
import { sortOn } from '@proton/pass/utils/fp/sort';

import { buildPersonalAccessTokenShareKeys, decryptPersonalAccessTokenKey } from './helpers';

type Props = {
    token: PersonalAccessToken;
    onClose: () => void;
    onSaved: () => void;
};

export const ManageAccessModal: FC<Props> = ({ token, onClose, onSaved }) => {
    const { createNotification } = useNotifications();
    const writableVaults = useSelector(selectWritableVaults);

    const vaults = useMemo(() => [...writableVaults].sort(sortOn('createTime', 'ASC')), [writableVaults]);

    const [initialShareIds, setInitialShareIds] = useState<Set<string>>(() => new Set());
    const [selectedShareIds, setSelectedShareIds] = useState<Set<string>>(() => new Set());
    /* Map user's local shareId → PAT-scoped grant ShareID from the list response.
     * Needed because revoke targets the grant's ShareID, not the user's shareId. */
    const [grantShareIdByVault, setGrantShareIdByVault] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let ignore = false;

        void (async () => {
            setIsLoading(true);
            try {
                const grants = await listPersonalAccessTokenAccess(token.PersonalAccessTokenID);
                if (!ignore) {
                    const grantByVaultId = new Map(grants.map((g) => [g.VaultID, g.ShareID]));
                    const grantByShareId: Record<string, string> = {};
                    const grantedShareIds = new Set<string>();

                    for (const vault of vaults) {
                        const patShareId = grantByVaultId.get(vault.vaultId);
                        if (patShareId) {
                            grantedShareIds.add(vault.shareId);
                            grantByShareId[vault.shareId] = patShareId;
                        }
                    }

                    setGrantShareIdByVault(grantByShareId);
                    setInitialShareIds(grantedShareIds);
                    setSelectedShareIds(new Set(grantedShareIds));
                }
            } catch {
                if (!ignore) {
                    createNotification({
                        type: 'error',
                        text: c('pass_2026: Error').t`Failed to load current vault access`,
                    });
                }
            } finally {
                if (!ignore) setIsLoading(false);
            }
        })();

        return () => {
            ignore = true;
        };
    }, [token.PersonalAccessTokenID, vaults]);

    const toggleVault = (shareId: string) => {
        setSelectedShareIds((prev) => {
            const next = new Set(prev);
            if (next.has(shareId)) next.delete(shareId);
            else next.add(shareId);
            return next;
        });
    };

    const handleSave = async () => {
        const toGrant: string[] = [];
        const toRevoke: string[] = [];
        for (const id of selectedShareIds) if (!initialShareIds.has(id)) toGrant.push(id);
        for (const id of initialShareIds) if (!selectedShareIds.has(id)) toRevoke.push(id);

        if (toGrant.length === 0 && toRevoke.length === 0) {
            onClose();
            return;
        }

        setIsSaving(true);
        try {
            let rawPatKey: Uint8Array<ArrayBuffer> | null = null;

            if (toGrant.length > 0) {
                const primaryUserKey = PassCrypto.getContext().primaryUserKey;
                if (!primaryUserKey?.publicKey || !primaryUserKey?.privateKey) {
                    createNotification({
                        type: 'error',
                        text: c('pass_2026: Error').t`Could not retrieve your encryption key`,
                    });
                    setIsSaving(false);
                    return;
                }
                rawPatKey = await decryptPersonalAccessTokenKey(
                    token.PersonalAccessTokenKey,
                    primaryUserKey.privateKey,
                    primaryUserKey.publicKey
                );
            }

            await Promise.all([
                ...toGrant.map(async (shareId) =>
                    grantPersonalAccessTokenAccess(token.PersonalAccessTokenID, {
                        ShareID: shareId,
                        TargetType: ShareType.Vault,
                        ShareRoleID: ShareRole.READ,
                        Keys: await buildPersonalAccessTokenShareKeys(rawPatKey!, shareId),
                    })
                ),
                ...toRevoke.map((shareId) => {
                    const grantShareId = grantShareIdByVault[shareId];
                    if (!grantShareId) return Promise.resolve();
                    return revokePersonalAccessTokenAccess(token.PersonalAccessTokenID, grantShareId);
                }),
            ]);

            createNotification({ text: c('pass_2026: Notification').t`Vault access updated` });
            onSaved();
        } catch {
            createNotification({
                type: 'error',
                text: c('pass_2026: Error').t`Failed to update vault access`,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = (() => {
        if (selectedShareIds.size !== initialShareIds.size) return true;
        for (const id of selectedShareIds) if (!initialShareIds.has(id)) return true;
        return false;
    })();

    return (
        <PassModal open onClose={onClose} onReset={onClose} size="medium">
            <ModalTwoHeader title={c('pass_2026: Title').t`Manage vault access`} />
            <ModalTwoContent>
                <p className="color-weak mt-0 mb-3">
                    {c('pass_2026: Info').t`Select the vaults "${token.Name}" can read. Changes apply immediately.`}
                </p>

                {(() => {
                    if (isLoading) {
                        return (
                            <div className="flex justify-center py-6">
                                <CircleLoader size="medium" />
                            </div>
                        );
                    }
                    if (vaults.length === 0) {
                        return <div className="text-sm color-weak">{c('pass_2026: Info').t`No vaults available.`}</div>;
                    }
                    return (
                        <div
                            className="flex flex-column gap-1 rounded border border-weak overflow-auto"
                            style={{ maxHeight: '16rem' }}
                        >
                            {vaults.map((vault) => {
                                const checked = selectedShareIds.has(vault.shareId);
                                return (
                                    <label
                                        key={vault.shareId}
                                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-weak"
                                    >
                                        <Checkbox checked={checked} onChange={() => toggleVault(vault.shareId)} />
                                        <VaultIcon
                                            color={vault.content.display.color}
                                            icon={vault.content.display.icon}
                                            size={3}
                                            background
                                        />
                                        <span className="text-ellipsis">{vault.content.name}</span>
                                    </label>
                                );
                            })}
                        </div>
                    );
                })()}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose} disabled={isSaving}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button
                    color="norm"
                    onClick={handleSave}
                    loading={isSaving}
                    disabled={isSaving || isLoading || !hasChanges}
                >
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
