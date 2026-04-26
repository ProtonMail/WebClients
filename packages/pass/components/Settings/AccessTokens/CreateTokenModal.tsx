import type { ChangeEvent, FC } from 'react';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Toggle from '@proton/components/components/toggle/Toggle';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useNotifications from '@proton/components/hooks/useNotifications';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import {
    createPersonalAccessToken,
    grantPersonalAccessTokenAccess,
} from '@proton/pass/lib/access-token/access-token.requests';
import type { PersonalAccessToken } from '@proton/pass/lib/access-token/access-token.types';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { selectWritableVaults } from '@proton/pass/store/selectors';
import { ShareRole, ShareType } from '@proton/pass/types';
import { sortOn } from '@proton/pass/utils/fp/sort';

import {
    PAT_PRODUCT,
    buildAccessTokenEnvVar,
    buildPersonalAccessTokenKey,
    buildPersonalAccessTokenShareKeys,
    getExpirationTimestampFromMinutes,
} from './helpers';

type Props = {
    onClose: () => void;
    onCreated: (envVar: string, pat: PersonalAccessToken, agent: boolean) => void;
};

const MAX_NAME_LENGTH = 191;
const MIN_EXPIRATION_MINUTES = 60;
const MAX_EXPIRATION_MINUTES = 365 * 24 * 60;

export const CreateTokenModal: FC<Props> = ({ onClose, onCreated }) => {
    const { createNotification } = useNotifications();
    const writableVaults = useSelector(selectWritableVaults);

    const vaults = useMemo(() => [...writableVaults].sort(sortOn('createTime', 'ASC')), [writableVaults]);

    const [name, setName] = useState('');
    const [expirationMinutes, setExpirationMinutes] = useState('60');
    const [isAgent, setIsAgent] = useState(false);
    const [selectedShareIds, setSelectedShareIds] = useState<Set<string>>(() => new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nameError, setNameError] = useState('');
    const [minutesError, setMinutesError] = useState('');

    const toggleVault = (shareId: string) => {
        setSelectedShareIds((prev) => {
            const next = new Set(prev);
            if (next.has(shareId)) next.delete(shareId);
            else next.add(shareId);
            return next;
        });
    };

    const handleCreate = async () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            setNameError(c('pass_2026: Error').t`Name is required`);
            return;
        }
        if (trimmedName.length > MAX_NAME_LENGTH) {
            setNameError(c('pass_2026: Error').t`Name must be 191 characters or fewer`);
            return;
        }

        const minutes = Number(expirationMinutes);
        if (
            !Number.isFinite(minutes) ||
            !Number.isInteger(minutes) ||
            minutes < MIN_EXPIRATION_MINUTES ||
            minutes > MAX_EXPIRATION_MINUTES
        ) {
            setMinutesError(c('pass_2026: Error').t`Expiration must be between 60 minutes 1 year`);
            return;
        }
        const expireTime = getExpirationTimestampFromMinutes(minutes);

        setIsSubmitting(true);
        setNameError('');
        setMinutesError('');

        try {
            const primaryUserKey = PassCrypto.getContext().primaryUserKey;
            if (!primaryUserKey?.publicKey || !primaryUserKey?.privateKey) {
                createNotification({
                    type: 'error',
                    text: c('pass_2026: Error').t`Could not retrieve your encryption key`,
                });
                setIsSubmitting(false);
                return;
            }

            const { encrypted, raw } = await buildPersonalAccessTokenKey(
                primaryUserKey.publicKey,
                primaryUserKey.privateKey
            );
            const pat = await createPersonalAccessToken({
                Name: trimmedName,
                Products: [PAT_PRODUCT],
                PersonalAccessTokenKey: encrypted,
                ExpireTime: expireTime,
                Flags: isAgent ? { PassAgent: true } : null,
            });

            if (!pat.Token) {
                createNotification({
                    type: 'error',
                    text: c('pass_2026: Error').t`Failed to create access token`,
                });
                return;
            }

            if (selectedShareIds.size > 0) {
                try {
                    await Promise.all(
                        Array.from(selectedShareIds).map(async (shareId) =>
                            grantPersonalAccessTokenAccess(pat.PersonalAccessTokenID, {
                                ShareID: shareId,
                                TargetType: ShareType.Vault,
                                ShareRoleID: ShareRole.READ,
                                Keys: await buildPersonalAccessTokenShareKeys(raw, shareId),
                            })
                        )
                    );
                } catch {
                    createNotification({
                        type: 'error',
                        text: c('pass_2026: Error')
                            .t`Access token was created but vault access could not be granted. Remove the token and try again.`,
                    });
                }
            }

            onCreated(buildAccessTokenEnvVar(pat.Token, raw), pat, isAgent);
        } catch {
            createNotification({
                type: 'error',
                text: c('pass_2026: Error').t`Failed to create access token`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PassModal open onClose={onClose} onReset={onClose} size="medium">
            <ModalTwoHeader title={c('pass_2026: Title').t`Create new access token`} />
            <ModalTwoContent className="pt-2">
                <InputFieldTwo
                    id="pat-name"
                    label={c('pass_2026: Label').t`Token name`}
                    placeholder={c('pass_2026: Placeholder').t`e.g. My automation script`}
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setName(e.target.value);
                        if (nameError) setNameError('');
                    }}
                    error={nameError}
                    assistContainerClassName={nameError ? undefined : 'hidden'}
                    maxLength={MAX_NAME_LENGTH}
                    rootClassName="mb-4"
                    autoFocus
                />
                <InputFieldTwo
                    id="pat-expiry-minutes"
                    type="number"
                    min={MIN_EXPIRATION_MINUTES}
                    max={MAX_EXPIRATION_MINUTES}
                    step={1}
                    label={c('pass_2026: Label').t`Expires in (minutes)`}
                    hint={c('pass_2026: Info').t`Between 60 (1 hour) and 525600 (1 year)`}
                    placeholder={c('pass_2026: Placeholder').t`e.g. 60`}
                    value={expirationMinutes}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setExpirationMinutes(e.target.value);
                        if (minutesError) setMinutesError('');
                    }}
                    error={minutesError}
                    assistContainerClassName={minutesError ? undefined : 'hidden'}
                    rootClassName="mb-4"
                />

                <div className="flex items-start justify-space-between gap-4 mb-4">
                    <div className="flex-1">
                        <label htmlFor="pat-agent" className="text-bold block">
                            {c('pass_2026: Label').t`Issue for AI agent`}
                        </label>
                        <span className="block mt-1">
                            {c('pass_2026: Info').t`Show setup instructions tailored for an AI agent after creation.`}
                        </span>
                    </div>
                    <Toggle
                        id="pat-agent"
                        checked={isAgent}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setIsAgent(e.target.checked)}
                    />
                </div>

                <hr className="my-5 border-weak" />

                <div>
                    <div className="flex items-baseline justify-space-between mb-1">
                        <h3 className="text-bold text-lg m-0">{c('pass_2026: Label').t`Vault access`}</h3>
                        {vaults.length > 0 && (
                            <span className="text-sm color-weak">
                                {selectedShareIds.size > 0
                                    ? c('pass_2026: Info').t`${selectedShareIds.size} selected`
                                    : c('pass_2026: Info').t`None selected`}
                            </span>
                        )}
                    </div>
                    <p className="text-sm color-weak mt-0 mb-2">
                        {c('pass_2026: Info')
                            .t`This token gets read-only access to the vaults you select. It can read items, but cannot edit them, or share vaults to others.`}
                    </p>
                    {vaults.length === 0 ? (
                        <div className="text-sm color-weak">{c('pass_2026: Info').t`No vaults available.`}</div>
                    ) : (
                        <div
                            className="flex flex-column gap-1 rounded border border-weak overflow-auto"
                            style={{ maxHeight: '12rem' }}
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
                    )}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose} disabled={isSubmitting}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" onClick={handleCreate} loading={isSubmitting} disabled={isSubmitting}>
                    {c('pass_2026: Action').t`Create token`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
