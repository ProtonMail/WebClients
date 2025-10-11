import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { changeOrganizationSignature } from '@proton/account';
import { useAddresses } from '@proton/account/addresses/hooks';
import { getIsEligibleOrganizationIdentityAddress } from '@proton/account/organizationKey/actions';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
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

    const hasEligibleAddresses = eligibleAddresses.length > 0;

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
                    if (!hasEligibleAddresses) {
                        const primaryAddress = addresses?.[0];
                        if (!initialSignatureAddress && primaryAddress && !getIsAddressConfirmed(primaryAddress)) {
                            const email = <strong key="email">({primaryAddress.Email})</strong>;
                            return (
                                <div className="text-break">
                                    {c('orgidentity')
                                        .jt`Verify your email address ${email} to set organization identity.`}
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
            {hasEligibleAddresses ? (
                <ModalFooter>
                    <Button onClick={rest.onClose} disabled={submitting}>{c('Action').t`Cancel`}</Button>
                    <Button color="norm" type="submit" loading={submitting}>{c('Action').t`Save`}</Button>
                </ModalFooter>
            ) : (
                <ModalFooter>
                    <div>{/* Empty div to align right */}</div>
                    <ButtonLike color="norm" as={SettingsLink} onClick={rest.onClose} path="/account-password">
                        {c('Action').t`Verify`}
                    </ButtonLike>
                </ModalFooter>
            )}
        </Modal>
    );
};

export default EditOrganizationIdentityModal;
