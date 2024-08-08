import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { changeOrganizationSignature } from '@proton/account';
import { Button } from '@proton/atoms/Button';
import type { ModalProps } from '@proton/components/components';
import {
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    Option,
    SelectTwo,
    useFormErrors,
} from '@proton/components/components';
import { useAddresses, useErrorHandler, useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { getIsAddressEnabled } from '@proton/shared/lib/helpers/address';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

interface Props extends ModalProps<'div'> {
    signatureAddress?: string;
}

const EditOrganizationIdentityModal = ({ signatureAddress: initialSignatureAddress, ...rest }: Props) => {
    const [submitting, withSubmitting] = useLoading();
    const [addresses] = useAddresses();
    const { validator, onFormSubmit } = useFormErrors();
    const activeAddresses = (addresses || []).filter(getIsAddressEnabled);
    const [addressID, setAddressID] = useState<string | null>(() => {
        return activeAddresses.find((address) => address.Email === initialSignatureAddress)?.ID || null;
    });
    const dispatch = useDispatch();
    const errorHandler = useErrorHandler();
    const { createNotification } = useNotifications();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (!onFormSubmit()) {
            return;
        }

        const address = addresses?.find((address) => address.ID === addressID);
        if (address) {
            const handleSubmit = async () => {
                await dispatch(changeOrganizationSignature({ address }));
                createNotification({ text: c('Success').t`Organization identity updated` });
                rest.onClose?.();
            };
            withSubmitting(handleSubmit()).catch(errorHandler);
        }
    };

    return (
        <Modal as="form" size="small" {...rest} onSubmit={handleSubmit}>
            <ModalHeader title={c('Title').t`Edit organization identity`} />
            <ModalContent>
                {initialSignatureAddress && (
                    <div className="mb-6">
                        <div className="text-semibold mb-1">{c('Label').t`Current organization identity`}</div>
                        <div className="text-ellipsis" title={initialSignatureAddress}>
                            {initialSignatureAddress}
                        </div>
                    </div>
                )}
                <InputFieldTwo
                    id="organizationIdentity"
                    as={SelectTwo<string | null>}
                    error={validator([requiredValidator(addressID)])}
                    value={addressID}
                    onValue={(addressID: string | null) => {
                        if (addressID) {
                            setAddressID(addressID);
                        }
                    }}
                    label={c('Label').t`New organization identity`}
                >
                    {activeAddresses.map((address) => (
                        <Option title={address.Email} key={address.ID} value={address.ID} />
                    ))}
                </InputFieldTwo>
            </ModalContent>
            <ModalFooter>
                <Button onClick={rest.onClose} disabled={submitting}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={submitting}>{c('Action').t`Save`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default EditOrganizationIdentityModal;
