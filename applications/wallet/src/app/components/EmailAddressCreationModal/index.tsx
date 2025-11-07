import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { createAddress } from '@proton/account/addresses/actions';
import { useCustomDomains } from '@proton/account/domains/hooks';
import { useMembers } from '@proton/account/members/hooks';
import { useProtonDomains } from '@proton/account/protonDomains/hooks';
import { useUser } from '@proton/account/user/hooks';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { DropdownSizeUnit, type ModalOwnProps, Option, SelectTwo } from '@proton/components';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { getAvailableAddressDomains } from '@proton/shared/lib/helpers/address';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces';

import { Button } from '@proton/atoms/Button/Button';
import { Input, Modal } from '../../atoms';

interface Props extends ModalOwnProps {
    onAddressCreated?: (address: Address) => void;
}

export const EmailAddressCreationModal = ({ onAddressCreated, ...modalProps }: Props) => {
    const [user] = useUser();
    const [members, loadingMembers] = useMembers();
    const [customDomains] = useCustomDomains();
    const [{ premiumDomains, protonDomains }] = useProtonDomains();

    const { createNotification } = useNotifications();

    const [local, setLocal] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const dispatch = useDispatch();
    const errorHandler = useErrorHandler();

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
        if (!checkData() || !member) {
            return;
        }

        try {
            const address = await dispatch(
                createAddress({
                    member,
                    emailAddressParts: { Local: local, Domain: selectedDomain },
                    displayName,
                })
            );
            onAddressCreated?.(address);
            createNotification({ text: c('Wallet preference').t`Email address created` });
        } catch (e) {
            errorHandler(e);
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
