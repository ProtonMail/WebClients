import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useLoading } from '@proton/hooks';
import { renameExternalAddress } from '@proton/shared/lib/api/addresses';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { confirmEmailValidator, emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Address } from '@proton/shared/lib/interfaces';
import { getRenamedAddressKeys } from '@proton/shared/lib/keys';

import { InputFieldTwo, useFormErrors } from '../../components';
import { useApi, useEventManager, useGetOrganizationKey, useGetUserKeys, useNotifications } from '../../hooks';

interface Props extends ModalProps<'form'> {
    address: Address;
}

const EditExternalAddressModal = ({ address, ...rest }: Props) => {
    const [initialEmailAddress] = useState(address.Email);
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const getUserKeys = useGetUserKeys();
    const getOrganizationKey = useGetOrganizationKey();
    const { createNotification } = useNotifications();
    const { onFormSubmit, validator } = useFormErrors();
    const [submitting, withLoading] = useLoading();
    const api = useApi();
    const { call } = useEventManager();

    const handleSubmit = async () => {
        const userKeys = await getUserKeys();
        const organizationKey = await getOrganizationKey();
        const [Local, Domain] = getEmailParts(email);
        await api(
            renameExternalAddress(address.ID, {
                Local,
                Domain,
                AddressKeys: await getRenamedAddressKeys({
                    userKeys,
                    addressKeys: address.Keys,
                    organizationKey: organizationKey?.privateKey ? organizationKey : undefined,
                    email,
                }),
            })
        );
        await call();
        createNotification({ text: c('Success').t`Email address updated` });
        rest.onClose?.();
    };

    const handleClose = submitting ? undefined : rest.onClose;

    return (
        <Modal
            as="form"
            size="small"
            {...rest}
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                event.stopPropagation();
                if (!onFormSubmit()) {
                    return;
                }
                withLoading(handleSubmit());
            }}
            onClose={handleClose}
            noValidate
        >
            <ModalHeader
                title={c('Title').t`Edit email address`}
                subline={c('Title')
                    .t`We'll send an email to your new address with instructions on completing the change.`}
            />
            <ModalContent>
                <div className="mb-4">
                    <div className="text-semibold mb-1">{c('Label').t`Current email`}</div>
                    <div className="text-ellipsis rounded bg-weak px-3 py-2" title={initialEmailAddress}>
                        {initialEmailAddress}
                    </div>
                </div>
                <InputFieldTwo
                    type="email"
                    autoComplete="email"
                    id="email"
                    autoFocus
                    value={email}
                    onValue={setEmail}
                    error={validator([requiredValidator(email), emailValidator(email)])}
                    label={c('Label').t`New email`}
                />
                <InputFieldTwo
                    type="email"
                    autoComplete="email"
                    id="email-confirm"
                    value={confirmEmail}
                    onValue={setConfirmEmail}
                    error={validator([confirmEmailValidator(email, confirmEmail)])}
                    label={c('Label').t`Confirm email`}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={submitting}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={submitting}>{c('Action').t`Save`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default EditExternalAddressModal;
