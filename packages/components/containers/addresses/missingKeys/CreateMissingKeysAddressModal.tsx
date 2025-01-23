import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { createMissingKeys } from '@proton/account/addresses/actions';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import {
    confirmPasswordValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import type { Address, Member } from '@proton/shared/lib/interfaces';
import { getShouldSetupMemberKeys } from '@proton/shared/lib/keys';

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
    const { validator, onFormSubmit } = useFormErrors();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const [, setFormattedAddresses] = useState<AddressState>({});

    const shouldSetupMemberKeys = getShouldSetupMemberKeys(member);

    const handleSubmit = async () => {
        const handleUpdate = (addressID: string, event: { status: 'loading' | 'ok' | 'error'; result?: string }) => {
            setFormattedAddresses((oldState) => {
                return updateAddress(oldState, addressID, {
                    type: getStatus(event.status),
                    tooltip: event.result,
                });
            });
        };
        const result = await dispatch(
            createMissingKeys({ member, password, addressesToGenerate, onUpdate: handleUpdate })
        );
        createNotification({ text: result });
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
