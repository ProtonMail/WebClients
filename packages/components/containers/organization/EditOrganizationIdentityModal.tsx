import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { changeOrganizationSignature, getIsEligibleOrganizationIdentityAddress } from '@proton/account';
import { Button } from '@proton/atoms';
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
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { useAddresses, useErrorHandler, useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { getIsAddressConfirmed } from '@proton/shared/lib/helpers/address';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

interface Props extends ModalProps<'div'> {
    signatureAddress?: string;
}

const EditOrganizationIdentityModal = ({ signatureAddress: initialSignatureAddress, ...rest }: Props) => {
    const [submitting, withSubmitting] = useLoading();
    const [addresses] = useAddresses();
    const { validator, onFormSubmit } = useFormErrors();
    const eligibleAddresses = (addresses || []).filter(getIsEligibleOrganizationIdentityAddress);
    const [addressID, setAddressID] = useState<string | null>(() => {
        return eligibleAddresses.find((address) => address.Email === initialSignatureAddress)?.ID || null;
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
                createNotification({ text: c('orgidentity').t`Organization identity updated` });
                rest.onClose?.();
            };
            withSubmitting(handleSubmit()).catch(errorHandler);
        }
    };

    return (
        <Modal as="form" size="small" {...rest} onSubmit={handleSubmit}>
            <ModalHeader title={c('orgidentity').t`Edit organization identity`} />
            <ModalContent>
                {initialSignatureAddress && (
                    <div className="mb-6">
                        <div className="text-semibold mb-1">{c('orgidentity').t`Current organization identity`}</div>
                        <div className="text-ellipsis" title={initialSignatureAddress}>
                            {initialSignatureAddress}
                        </div>
                    </div>
                )}
                {(() => {
                    if (!eligibleAddresses.length) {
                        const primaryAddress = addresses?.[0];
                        if (!initialSignatureAddress && primaryAddress && !getIsAddressConfirmed(primaryAddress)) {
                            const verify = (
                                <SettingsLink path="/account-password" key="verify">
                                    {c('orgidentity').t`Verify`}
                                </SettingsLink>
                            );
                            const email = <strong key="email">({primaryAddress.Email})</strong>;
                            return (
                                <div className="text-break">
                                    {c('orgidentity')
                                        .jt`${verify} your email address ${email} to set organization identity.`}
                                </div>
                            );
                        }
                        return null;
                    }
                    return (
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
                            label={c('orgidentity').t`New organization identity`}
                        >
                            {eligibleAddresses.map((address) => (
                                <Option title={address.Email} key={address.ID} value={address.ID} />
                            ))}
                        </InputFieldTwo>
                    );
                })()}
            </ModalContent>
            <ModalFooter>
                <Button onClick={rest.onClose} disabled={submitting}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={submitting}>{c('Action').t`Save`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default EditOrganizationIdentityModal;
