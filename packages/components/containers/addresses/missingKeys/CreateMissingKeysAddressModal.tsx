import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { createAddressKeysThunk, getCreateAddressKeysPayload } from '@proton/account/addressKeys/createAddressKeys';
import { usePasswordPolicies } from '@proton/account/passwordPolicies/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { Address, Member } from '@proton/shared/lib/interfaces';
import { getShouldSetupMemberKeys } from '@proton/shared/lib/keys';

import type { ModalProps } from '../../../components/modalTwo/Modal';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import PasswordWithPolicyInputs from '../../../components/passwordPolicy/PasswordWithPolicyInputs';
import { usePasswordPolicyValidation } from '../../../components/passwordPolicy/index';
import Table from '../../../components/table/Table';
import TableBody from '../../../components/table/TableBody';
import TableHeader from '../../../components/table/TableHeader';
import TableRow from '../../../components/table/TableRow';
import useFormErrors from '../../../components/v2/useFormErrors';
import useErrorHandler from '../../../hooks/useErrorHandler';
import useNotifications from '../../../hooks/useNotifications';

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

type AddressState = { [key: string]: Status };

export const updateAddress = (oldAddresses: AddressState, ID: string, diff: Status) => {
    return {
        ...oldAddresses,
        [ID]: diff,
    };
};

const CreateMissingKeysAddressModal = ({ member, addressesToGenerate, ...rest }: Props) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const formErrors = useFormErrors();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const [, setFormattedAddresses] = useState<AddressState>({});

    const shouldSetupMemberKeys = getShouldSetupMemberKeys(member);
    const passwordPolicyValidation = usePasswordPolicyValidation(password, usePasswordPolicies());
    const passwordPolicyError = shouldSetupMemberKeys && !passwordPolicyValidation.valid;

    const handleSubmit = async () => {
        const handleUpdate = (addressID: string, event: { status: 'loading' | 'ok' | 'error'; result?: string }) => {
            setFormattedAddresses((oldState) => {
                return updateAddress(oldState, addressID, {
                    type: getStatus(event.status),
                    tooltip: event.result,
                });
            });
        };
        const payload = await dispatch(getCreateAddressKeysPayload({ member, password }));
        await dispatch(
            createAddressKeysThunk({ addressKeyCreationPayload: payload, addressesToGenerate, onUpdate: handleUpdate })
        );
        if (payload.type === 'user') {
            createNotification({ text: c('Info').t`Keys created` });
        } else if (payload.type === 'non-private-member') {
            if (payload.payload.shouldSetupMemberKeys) {
                createNotification({ text: c('Info').t`User activated` });
            } else {
                createNotification({ text: c('Info').t`Keys created` });
            }
        } else if (payload.type === 'private-member') {
            // Should never happen, so we don't translate this case.
            createNotification({ text: 'Can not generate keys for private members' });
        }
        rest.onClose?.();
    };

    return (
        <ModalTwo
            {...rest}
            as="form"
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                event.stopPropagation();
                if (!formErrors.onFormSubmit() || passwordPolicyError) {
                    return;
                }
                withLoading(handleSubmit()).catch(handleError);
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
                        <PasswordWithPolicyInputs
                            loading={loading}
                            passwordPolicyValidation={passwordPolicyValidation}
                            passwordState={[password, setPassword]}
                            confirmPasswordState={[confirmPassword, setConfirmPassword]}
                            formErrors={formErrors}
                            formLabels={{
                                password: c('Label').t`Password`,
                                confirmPassword: c('Label').t`Confirm password`,
                            }}
                            isAboveModal={true}
                        />
                    </>
                )}
                {addressesToGenerate.length > 0 && (
                    <Table>
                        <TableHeader cells={[c('Header for addresses table').t`Address`]} />
                        <TableBody colSpan={1}>
                            {addressesToGenerate.map((address) => (
                                <TableRow
                                    key={address.ID}
                                    cells={[
                                        <span key={0} className="text-ellipsis block pr-4" title={address.Email}>
                                            {address.Email}
                                        </span>,
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
