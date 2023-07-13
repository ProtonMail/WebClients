import { FormEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { getAllMemberAddresses } from '@proton/shared/lib/api/members';
import {
    DEFAULT_ENCRYPTION_CONFIG,
    ENCRYPTION_CONFIGS,
    ENCRYPTION_TYPES,
    MEMBER_PRIVATE,
} from '@proton/shared/lib/constants';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { Address, CachedOrganizationKey, Member } from '@proton/shared/lib/interfaces';
import {
    getShouldSetupMemberKeys,
    missingKeysMemberProcess,
    missingKeysSelfProcess,
    setupMemberKeys,
} from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import {
    InputFieldTwo,
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
    useEventManager,
    useGetAddresses,
    useGetUser,
    useGetUserKeys,
    useNotifications,
} from '../../../hooks';
import { useKTVerifier } from '../../keyTransparency';
import SelectEncryption from '../../keys/addKey/SelectEncryption';
import MissingKeysStatus from './MissingKeysStatus';
import { AddressWithStatus, Status } from './interface';
import { updateAddress } from './state';

enum STEPS {
    INIT = 0,
    DONE,
    ERROR,
}

interface Props extends ModalProps<'form'> {
    member?: Member;
    addressesToGenerate: Address[];
    organizationKey?: CachedOrganizationKey;
}

const getStatus = (text: 'ok' | 'loading' | 'error') => {
    switch (text) {
        case 'ok':
            return Status.DONE;
        case 'loading':
            return Status.LOADING;
        default:
        case 'error':
            return Status.FAILURE;
    }
};

const CreateMissingKeysAddressModal = ({ member, addressesToGenerate, organizationKey, ...rest }: Props) => {
    const api = useApi();
    const authentication = useAuthentication();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { validator, onFormSubmit } = useFormErrors();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [step, setStep] = useState(STEPS.INIT);
    const getUserKeys = useGetUserKeys();
    const getAddresses = useGetAddresses();
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, useGetUser());
    const [formattedAddresses, setFormattedAddresses] = useState<AddressWithStatus[]>(() =>
        addressesToGenerate.map((address) => ({
            ...address,
            status: {
                type: Status.QUEUED,
            },
        }))
    );

    const shouldSetupMemberKeys = getShouldSetupMemberKeys(member);

    const [encryptionType, setEncryptionType] = useState<ENCRYPTION_TYPES>(DEFAULT_ENCRYPTION_CONFIG);

    const processMember = async (member: Member) => {
        if (!organizationKey?.privateKey) {
            createNotification({ text: c('Error').t`Organization key is not decrypted`, type: 'error' });
            return;
        }
        try {
            const [memberAddresses, addresses, userKeys] = await Promise.all([
                getAllMemberAddresses(api, member.ID),
                getAddresses(),
                getUserKeys(),
            ]);

            const encryptionConfig = ENCRYPTION_CONFIGS[encryptionType];

            const handleUpdate = (
                addressID: string,
                event: { status: 'loading' | 'ok' | 'error'; result?: string }
            ) => {
                setFormattedAddresses((oldState) => {
                    return updateAddress(oldState, addressID, {
                        status: {
                            type: getStatus(event.status),
                            tooltip: event.result,
                        },
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
                    api,
                    keyTransparencyVerify,
                });
                addressesToGenerate.forEach((address) => handleUpdate(address.ID, { status: 'ok' }));
            } else {
                await missingKeysMemberProcess({
                    api,
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
        } catch (e: any) {
            createNotification({ text: e.message, type: 'error' });
        }
    };

    const processSelf = async () => {
        const [userKeys, addresses] = await Promise.all([getUserKeys(), getAddresses()]);
        await missingKeysSelfProcess({
            api,
            userKeys,
            addresses,
            addressesToGenerate,
            password: authentication.getPassword(),
            encryptionConfig: ENCRYPTION_CONFIGS[encryptionType],
            onUpdate: (addressID, event) => {
                setFormattedAddresses((oldState) => {
                    return updateAddress(oldState, addressID, {
                        status: {
                            type: getStatus(event.status),
                            tooltip: event.result,
                        },
                    });
                });
            },
            keyTransparencyVerify,
        });
        await keyTransparencyCommit(userKeys);
        await call();
    };

    const handleSubmit = () => {
        return (
            !member || (member.Self && member.Private === MEMBER_PRIVATE.UNREADABLE)
                ? processSelf()
                : processMember(member)
        )
            .then(() => setStep(STEPS.DONE))
            .catch(() => setStep(STEPS.ERROR));
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
                title={
                    shouldSetupMemberKeys
                        ? c('Title').t`Activate account and generate keys`
                        : c('Title').t`Generate missing keys`
                }
            />
            <ModalTwoContent>
                <p className="color-weak">
                    {shouldSetupMemberKeys
                        ? c('Info')
                              .t`Before enabling the account you need to provide a password and create encryption keys for the new addresses.`
                        : c('Info')
                              .t`Before you can start sending and receiving emails from your new addresses you need to create encryption keys for them.`}
                </p>
                {shouldSetupMemberKeys && (
                    <>
                        <InputFieldTwo
                            required
                            autoFocus
                            id="password"
                            as={PasswordInputTwo}
                            value={password}
                            error={validator([passwordLengthValidator(password), requiredValidator(password)])}
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
                                passwordLengthValidator(confirmPassword),
                                confirmPasswordValidator(confirmPassword, password),
                            ])}
                            autoComplete="new-password"
                        />
                    </>
                )}
                <div className="text-semibold mb-1">{c('Label').t`Key strength`}</div>
                <SelectEncryption
                    encryptionType={encryptionType}
                    setEncryptionType={step === STEPS.INIT ? setEncryptionType : noop}
                />
                <Table>
                    <TableHeader
                        cells={[c('Header for addresses table').t`Address`, c('Header for addresses table').t`Status`]}
                    />
                    <TableBody colSpan={2}>
                        {formattedAddresses.map((address) => (
                            <TableRow
                                key={address.ID}
                                cells={[
                                    <span key={0} className="text-ellipsis block pr-4" title={address.Email}>
                                        {address.Email}
                                    </span>,
                                    <MissingKeysStatus key={1} {...address.status} />,
                                ]}
                            />
                        ))}
                    </TableBody>
                </Table>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Close`}</Button>
                {step === STEPS.INIT && (
                    <Button color="norm" loading={loading} type="submit">
                        {c('Action').t`Submit`}
                    </Button>
                )}
                {step === STEPS.ERROR && (
                    <Button loading={loading} type="button" onClick={rest.onClose}>
                        {c('Action').t`Close`}
                    </Button>
                )}
                {step === STEPS.DONE && (
                    <Button loading={loading} type="button" onClick={rest.onClose}>
                        {c('Action').t`Done`}
                    </Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CreateMissingKeysAddressModal;
