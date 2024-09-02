import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import noop from 'lodash/noop';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import type { ModalOwnProps } from '@proton/components/components';
import { DropdownSizeUnit, Option, SelectTwo } from '@proton/components/components';
import { useKTVerifier } from '@proton/components/containers';
import {
    useAddresses,
    useApi,
    useAuthentication,
    useCustomDomains,
    useMembers,
    useNotifications,
    useProtonDomains,
    useUser,
    useUserKeys,
} from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { createAddress } from '@proton/shared/lib/api/addresses';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import { getAvailableAddressDomains } from '@proton/shared/lib/helpers/address';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces';
import { missingKeysSelfProcess } from '@proton/shared/lib/keys';

import { Button, Input, Modal } from '../../atoms';

interface Props extends ModalOwnProps {
    onAddressCreated?: (address: Address) => void;
}

const keyGenConfig = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE];

export const EmailAddressCreationModal = ({ onAddressCreated, ...modalProps }: Props) => {
    const [user] = useUser();
    const [members, loadingMembers] = useMembers();
    const [customDomains] = useCustomDomains();
    const [{ premiumDomains, protonDomains }] = useProtonDomains();

    const api = useApi();
    const { createNotification } = useNotifications();

    const [userKeys] = useUserKeys();
    const [addresses] = useAddresses();
    const authentication = useAuthentication();

    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => user);

    const [local, setLocal] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [loadingAddressCreation, withLoadingAddressCreation] = useLoading();

    const emailAddress = `${local}@${selectedDomain}`;

    // For now we only allow creating self addresses and only for admins
    const member = user.isAdmin ? members?.find(({ Self }) => Self) : undefined;

    const domains = useMemo(
        () =>
            (member &&
                getAvailableAddressDomains({
                    member,
                    user,
                    premiumDomains,
                    customDomains,
                    protonDomains,
                })) ??
            [],
        [customDomains, member, premiumDomains, protonDomains, user]
    );

    useEffect(() => {
        if (domains.length > 1) {
            setSelectedDomain(domains[0]);
        }
    }, [domains]);

    const checkData = useCallback(() => {
        if (!validateEmailAddress(emailAddress)) {
            setError(c('Wallet preference').t`Email address is invalid`);
            return false;
        }

        setError(null);
        return true;
    }, [emailAddress]);

    useEffect(() => {
        if (error) {
            checkData();
        }
    }, [checkData, error]);

    const handleCreateEmail = async () => {
        if (!checkData() || !member || !userKeys || !addresses) {
            return;
        }

        try {
            const { Address } = await api<{ Address: Address }>(
                createAddress({
                    MemberID: member.ID,
                    Local: local,
                    Domain: selectedDomain,
                    DisplayName: displayName,
                })
            );

            await missingKeysSelfProcess({
                api,
                userKeys,
                addresses,
                addressesToGenerate: [Address],
                password: authentication.getPassword(),
                keyGenConfig,
                onUpdate: noop,
                keyTransparencyVerify,
            });

            await keyTransparencyCommit(userKeys);

            onAddressCreated?.(Address);
        } catch {
            createNotification({ text: c('Wallet preference').t`Email address created` });
        }
    };

    return (
        <Modal title={c('Wallet preference').t`Create email address`} size="medium" {...modalProps}>
            <div className="flex flex-column">
                <div className="mt-2">
                    <Input
                        label={c('Wallet preference').t`Email`}
                        labelContainerClassName="sr-only"
                        placeholder={c('Wallet preference').t`Email address`}
                        value={local}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setLocal(e.target.value);
                        }}
                        suffix={(() => {
                            if (loadingMembers) {
                                return <CircleLoader />;
                            }
                            if (domains.length === 0) {
                                return null;
                            }
                            if (domains.length === 1) {
                                return (
                                    <span className="text-ellipsis" id="user-domain-selected" title={`@${domains[0]}`}>
                                        @{domains[0]}
                                    </span>
                                );
                            }
                            return (
                                <SelectTwo
                                    unstyled
                                    size={{ width: DropdownSizeUnit.Static }}
                                    originalPlacement="bottom-end"
                                    value={selectedDomain}
                                    onChange={({ value }) => setSelectedDomain(value)}
                                >
                                    {domains.map((option) => (
                                        <Option key={option} value={option} title={`@${option}`}>
                                            @{option}
                                        </Option>
                                    ))}
                                </SelectTwo>
                            );
                        })()}
                    />
                </div>

                <div className="mt-2">
                    <Input
                        label={c('Wallet preference').t`Display name (optional)`}
                        labelContainerClassName="sr-only"
                        placeholder={c('Wallet preference').t`Display name (optional)`}
                        value={displayName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setDisplayName(e.target.value);
                        }}
                    />
                </div>

                <div className="flex flex-column w-full mt-2">
                    <Button
                        disabled={Boolean(!local || !selectedDomain || error || loadingAddressCreation)}
                        fullWidth
                        shape="solid"
                        color="norm"
                        className="mt-2"
                        onClick={() => {
                            void withLoadingAddressCreation(handleCreateEmail());
                        }}
                    >{c('Wallet preference').t`Create email`}</Button>
                    <Button
                        fullWidth
                        shape="ghost"
                        color="norm"
                        className="mt-2"
                        onClick={() => {
                            modalProps.onClose?.();
                        }}
                    >{c('Wallet preference').t`Cancel`}</Button>
                </div>
            </div>
        </Modal>
    );
};
