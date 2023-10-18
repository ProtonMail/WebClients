import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    useAuthentication,
    useBeforeUnload,
    useEventManager,
    useGetAddressKeys,
    useNotifications,
} from '@proton/components/hooks';
import useApi from '@proton/components/hooks/useApi';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { updatePrivateKeyRoute } from '@proton/shared/lib/api/keys';
import { authMember } from '@proton/shared/lib/api/members';
import { getOrganizationKeys } from '@proton/shared/lib/api/organization';
import { disable2FA } from '@proton/shared/lib/api/settings';
import { getUser, lockSensitiveSettings } from '@proton/shared/lib/api/user';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { Address, Api, OrganizationKey, User } from '@proton/shared/lib/interfaces';
import { Member } from '@proton/shared/lib/interfaces/Member';
import {
    generateKeySaltAndPassphrase,
    getCachedOrganizationKey,
    getDecryptedUserKeysHelper,
} from '@proton/shared/lib/keys';
import { getUpdateKeysPayload } from '@proton/shared/lib/keys/changePassword';
import { formatUser } from '@proton/shared/lib/models/userModel';
import { Credentials, srpVerify } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import {
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    PasswordInputTwo,
    useFormErrors,
} from '../../components';
import { GenericError } from '../error';
import { AuthModal } from '../password';

interface Inputs {
    newPassword: string;
    confirmPassword: string;
}

interface Props extends ModalProps {
    member: Member;
}

const ChangeMemberPasswordModal = ({ member, onClose, ...rest }: Props) => {
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const [data, setData] = useState<{ UID: string; credentials: Credentials }>();
    const authentication = useAuthentication();

    const api = useApi();
    const { call, stop, start } = useEventManager();
    const { createNotification } = useNotifications();
    const getAddressKeys = useGetAddressKeys();
    const { validator, onFormSubmit } = useFormErrors();

    const lockAndClose = (memberApi?: Api) => {
        if (memberApi) {
            void memberApi(lockSensitiveSettings());
        }

        void api(lockSensitiveSettings());
        onClose?.();
    };

    const [inputs, setInputs] = useState<Inputs>({
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState(false);

    useBeforeUnload(loading ? c('Info').t`By leaving now, changes may not be saved` : '');

    const setPartialInput = (object: Partial<Inputs>) => setInputs((oldState) => ({ ...oldState, ...object }));

    const newPasswordError = passwordLengthValidator(inputs.newPassword);
    const confirmPasswordError =
        passwordLengthValidator(inputs.confirmPassword) ||
        confirmPasswordValidator(inputs.newPassword, inputs.confirmPassword);

    const validateNewPasswords = () => {
        if (newPasswordError || confirmPasswordError) {
            throw new Error('Password error');
        }
    };

    const notifySuccess = () => {
        createNotification({ text: c('Success').t`Password updated` });
    };

    if (!data) {
        return (
            <AuthModal
                config={authMember(member.ID, { Unlock: true })}
                {...rest}
                onCancel={onClose}
                onSuccess={async ({ credentials, response }) => {
                    const data = await response.json();

                    const UID = data?.UID;

                    if (!UID) {
                        throw new Error('Failed to get auth data');
                    }

                    setData({ UID, credentials });
                }}
            />
        );
    }

    if (error) {
        const handleClose = () => {
            lockAndClose();
        };
        return (
            <Modal {...rest} onClose={handleClose}>
                <ModalHeader title={c('Title').t`Change password`} />
                <ModalContent>
                    <GenericError />
                </ModalContent>
                <ModalFooter>
                    <div />
                    <Button color="norm" onClick={handleClose}>
                        {c('Action').t`OK`}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    const getAddressesWithKeysList = (addresses: Address[]) => {
        return Promise.all(
            addresses.map(async (address) => {
                return {
                    address,
                    keys: await getAddressKeys(address.ID),
                };
            })
        );
    };

    const changeMemberPassword = async ({ memberApi, credentials }: { memberApi: Api; credentials: Credentials }) => {
        const keyPassword = authentication.getPassword();
        const User = await memberApi<{ User: User }>(getUser()).then(({ User }) => formatUser(User));

        const [addresses, userKeysList, organizationKey] = await Promise.all([
            getAllAddresses(memberApi),
            getDecryptedUserKeysHelper(User, keyPassword),
            User.isAdmin
                ? getCachedOrganizationKey({
                      keyPassword,
                      Key: await memberApi<OrganizationKey>(getOrganizationKeys()),
                  })
                : undefined,
        ]);

        if (userKeysList.length === 0) {
            throw new Error('No user keys');
        }

        validateNewPasswords();

        const { passphrase: newKeyPassword, salt: keySalt } = await generateKeySaltAndPassphrase(inputs.newPassword);

        const addressesWithKeys = await getAddressesWithKeysList(addresses);
        const updateKeysPayload = await getUpdateKeysPayload(
            addressesWithKeys,
            userKeysList,
            organizationKey?.privateKey,
            newKeyPassword,
            keySalt
        );

        if (member['2faStatus']) {
            await srpVerify({
                api: memberApi,
                credentials,
                config: disable2FA(),
            });
        }

        await srpVerify({
            api: memberApi,
            credentials: {
                password: inputs.newPassword,
            },
            config: updatePrivateKeyRoute(updateKeysPayload),
        });
    };

    const onSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        try {
            stop();

            setLoading(true);

            const { UID, credentials } = data;
            const memberApi = <T,>(config: any) => silentApi<T>(withUIDHeaders(UID, config));
            await changeMemberPassword({ memberApi, credentials });
            await call();

            notifySuccess();
            lockAndClose(memberApi);
        } catch (e: any) {
            setLoading(false);
            setError(true);
        } finally {
            start();
        }
    };

    const handleClose = loading ? noop : () => lockAndClose();

    const userName = (
        <b key="user" className="text-break">
            {member.Name} ({(member?.Addresses || [])[0]?.Email ?? ''})
        </b>
    );

    return (
        <Modal as={Form} onClose={handleClose} {...rest} onSubmit={onSubmit}>
            <ModalHeader title={c('Title').t`Change password`} />
            <ModalContent>
                <div className="mb-4">{c('Info').jt`Enter new password for user ${userName}.`}</div>
                <InputFieldTwo
                    id="newPassword"
                    label={c('Label').t`User's new password`}
                    error={validator([
                        requiredValidator(inputs.newPassword),
                        passwordLengthValidator(inputs.newPassword),
                    ])}
                    as={PasswordInputTwo}
                    autoFocus
                    autoComplete="new-password"
                    value={inputs.newPassword}
                    onValue={(value: string) => setPartialInput({ newPassword: value })}
                    disabled={loading}
                />

                <InputFieldTwo
                    id="confirmPassword"
                    label={c('Label').t`Confirm new password`}
                    error={validator([
                        requiredValidator(inputs.confirmPassword),
                        passwordLengthValidator(inputs.confirmPassword),
                        confirmPasswordValidator(inputs.newPassword, inputs.confirmPassword),
                    ])}
                    as={PasswordInputTwo}
                    autoComplete="new-password"
                    value={inputs.confirmPassword}
                    onValue={(value: string) => setPartialInput({ confirmPassword: value })}
                    disabled={loading}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button loading={loading} type="submit" color="norm">
                    {c('Action').t`Change password`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ChangeMemberPasswordModal;
