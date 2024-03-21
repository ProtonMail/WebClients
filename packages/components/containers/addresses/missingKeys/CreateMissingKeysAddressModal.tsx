import { FormEvent, useState } from 'react';

import { c } from 'ttag';

import { getMemberAddresses } from '@proton/account';
import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { Address, Member } from '@proton/shared/lib/interfaces';
import {
    getShouldSetupMemberKeys,
    missingKeysMemberProcess,
    missingKeysSelfProcess,
    setupMemberKeys,
} from '@proton/shared/lib/keys';
import { getOrganizationKeyInfo, validateOrganizationKey } from '@proton/shared/lib/organization/helper';
import noop from '@proton/utils/noop';

import {
    Badge,
    InputFieldTwo,
    LoaderIcon,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PasswordInputTwo,
    Table,
    TableBody,
    TableHeader,
    TableRow,
    useFormErrors,
} from '../../../components';
import {
    useApi,
    useAuthentication,
    useErrorHandler,
    useEventManager,
    useGetAddresses,
    useGetOrganization,
    useGetOrganizationKey,
    useGetUser,
    useGetUserKeys,
    useNotifications,
} from '../../../hooks';
import { useKTVerifier } from '../../keyTransparency';

interface Props extends ModalProps<'form'> {
    member?: Member;
    addressesToGenerate: Address[];
}

export enum StatusEnum {
    QUEUED,
    DONE,
    FAILURE,
    LOADING,
}

const getStatus = (text: 'ok' | 'loading' | 'error') => {
    switch (text) {
        case 'ok':
            return StatusEnum.DONE;
        case 'loading':
            return StatusEnum.LOADING;
        default:
        case 'error':
            return StatusEnum.FAILURE;
    }
};

export interface Status {
    type: StatusEnum;
    tooltip?: string;
}

const defaultStatus: Status = {
    type: StatusEnum.QUEUED,
};

type AddressState = { [key: string]: Status };

export const updateAddress = (oldAddresses: AddressState, ID: string, diff: Status) => {
    return {
        ...oldAddresses,
        [ID]: diff,
    };
};

const MissingKeysStatus = ({ type, tooltip }: Status) => {
    if (type === StatusEnum.QUEUED) {
        return <Badge type="default">{c('Info').t`Queued`}</Badge>;
    }

    if (type === StatusEnum.DONE) {
        return <Badge type="success">{c('Info').t`Done`}</Badge>;
    }

    if (type === StatusEnum.FAILURE) {
        return <Badge type="error" tooltip={tooltip}>{c('Error').t`Error`}</Badge>;
    }

    if (type === StatusEnum.LOADING) {
        return <LoaderIcon />;
    }
    return null;
};

const encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG];

const CreateMissingKeysAddressModal = ({ member, addressesToGenerate, ...rest }: Props) => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const authentication = useAuthentication();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { validator, onFormSubmit } = useFormErrors();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const getOrganization = useGetOrganization();
    const getOrganizationKey = useGetOrganizationKey();
    const getUserKeys = useGetUserKeys();
    const getAddresses = useGetAddresses();
    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, useGetUser());
    const [formattedAddresses, setFormattedAddresses] = useState<AddressState>({});

    const shouldSetupMemberKeys = getShouldSetupMemberKeys(member);

    const processMember = async (member: Member) => {
        try {
            const [organization, organizationKey, memberAddresses, addresses, userKeys] = await Promise.all([
                getOrganization(),
                getOrganizationKey(),
                dispatch(getMemberAddresses({ member, retry: true })),
                getAddresses(),
                getUserKeys(),
            ]);

            const error = validateOrganizationKey(getOrganizationKeyInfo(organization, organizationKey, addresses));
            if (error) {
                createNotification({ text: error, type: 'error' });
                return;
            }
            if (!organizationKey?.privateKey) {
                throw new Error('Missing key');
            }

            const handleUpdate = (
                addressID: string,
                event: { status: 'loading' | 'ok' | 'error'; result?: string }
            ) => {
                setFormattedAddresses((oldState) => {
                    return updateAddress(oldState, addressID, {
                        type: getStatus(event.status),
                        tooltip: event.result,
                    });
                });
            };

            if (shouldSetupMemberKeys && password) {
                await setupMemberKeys({
                    ownerAddresses: addresses,
                    encryptionConfig,
                    organizationKey: organizationKey.privateKey,
                    member,
                    memberAddresses,
                    password,
                    api: silentApi,
                    keyTransparencyVerify,
                });
                addressesToGenerate.forEach((address) => handleUpdate(address.ID, { status: 'ok' }));
            } else {
                await missingKeysMemberProcess({
                    api: silentApi,
                    encryptionConfig,
                    ownerAddresses: addresses,
                    memberAddressesToGenerate: addressesToGenerate,
                    member,
                    memberAddresses,
                    onUpdate: handleUpdate,
                    organizationKey: organizationKey.privateKey,
                    keyTransparencyVerify,
                });
            }
            await keyTransparencyCommit(userKeys);
            await call();
            createNotification({ text: c('Info').t`User activated` });
        } catch (e: any) {
            handleError(e);
        }
    };

    const processSelf = async () => {
        try {
            const [userKeys, addresses] = await Promise.all([getUserKeys(), getAddresses()]);
            await missingKeysSelfProcess({
                api: silentApi,
                userKeys,
                addresses,
                addressesToGenerate,
                password: authentication.getPassword(),
                encryptionConfig,
                onUpdate: (addressID, event) => {
                    setFormattedAddresses((oldState) => {
                        return updateAddress(oldState, addressID, {
                            type: getStatus(event.status),
                            tooltip: event.result,
                        });
                    });
                },
                keyTransparencyVerify,
            });
            await keyTransparencyCommit(userKeys);
            await call();
            createNotification({ text: c('Info').t`Keys created` });
        } catch (e: any) {
            handleError(e);
        }
    };

    const handleSubmit = () => {
        return (
            !member || (member.Self && member.Private === MEMBER_PRIVATE.UNREADABLE)
                ? processSelf()
                : processMember(member)
        )
            .catch(noop)
            .then(rest.onClose);
    };

    return (
        <ModalTwo
            {...rest}
            as="form"
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                event.stopPropagation();
                if (!onFormSubmit()) {
                    return;
                }
                withLoading(handleSubmit());
            }}
        >
            <ModalTwoHeader
                title={shouldSetupMemberKeys ? c('Title').t`Activate user` : c('Title').t`Generate missing keys`}
            />
            <ModalTwoContent>
                <p className="color-weak">
                    {shouldSetupMemberKeys
                        ? c('Info')
                              .t`Before activating the user, you need to provide a password and create encryption keys for the addresses.`
                        : c('Info')
                              .t`Before you can start sending and receiving emails from your new addresses you need to create encryption keys for them.`}
                </p>
                {shouldSetupMemberKeys && (
                    <>
                        <InputFieldTwo
                            autoFocus
                            id="password"
                            as={PasswordInputTwo}
                            value={password}
                            error={validator([requiredValidator(password), passwordLengthValidator(password)])}
                            onValue={setPassword}
                            label={c('Label').t`Password`}
                            placeholder={c('Placeholder').t`Password`}
                            autoComplete="new-password"
                        />
                        <InputFieldTwo
                            id="confirmPassword"
                            as={PasswordInputTwo}
                            label={c('Label').t`Confirm password`}
                            placeholder={c('Placeholder').t`Confirm`}
                            value={confirmPassword}
                            onValue={setConfirmPassword}
                            error={validator([
                                requiredValidator(confirmPassword),
                                passwordLengthValidator(confirmPassword),
                                confirmPasswordValidator(confirmPassword, password),
                            ])}
                            autoComplete="new-password"
                        />
                    </>
                )}
                {addressesToGenerate.length > 0 && (
                    <Table>
                        <TableHeader
                            cells={[
                                c('Header for addresses table').t`Address`,
                                c('Header for addresses table').t`Status`,
                            ]}
                        />
                        <TableBody colSpan={2}>
                            {addressesToGenerate.map((address) => (
                                <TableRow
                                    key={address.ID}
                                    cells={[
                                        <span key={0} className="text-ellipsis block pr-4" title={address.Email}>
                                            {address.Email}
                                        </span>,
                                        <MissingKeysStatus
                                            key={1}
                                            {...(formattedAddresses[address.ID]
                                                ? formattedAddresses[address.ID]
                                                : defaultStatus)}
                                        />,
                                    ]}
                                />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Close`}</Button>
                <Button color="norm" loading={loading} type="submit">
                    {c('Action').t`Submit`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CreateMissingKeysAddressModal;
