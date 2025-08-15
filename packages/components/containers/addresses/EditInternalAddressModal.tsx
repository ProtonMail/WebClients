import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { renameInternalAddressThunk } from '@proton/account/addresses/renameInternalAddress';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CANONICALIZE_SCHEME, canonicalizeEmail, getEmailParts } from '@proton/shared/lib/helpers/email';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Address } from '@proton/shared/lib/interfaces';

interface Props extends ModalProps<'form'> {
    address: Address;
}

const EditInternalAddressModal = ({ address, ...rest }: Props) => {
    const [initialEmail] = useState(address.Email);
    const [[initialLocalEmail, domain]] = useState(getEmailParts(initialEmail));
    const [initialDisplayName] = useState(address.DisplayName);

    const [displayName, setDisplayName] = useState(initialDisplayName);
    const [localEmail, setEmail] = useState(initialLocalEmail);
    const newEmail = `${localEmail}@${domain}`;
    const { createNotification } = useNotifications();
    const { onFormSubmit, validator } = useFormErrors();
    const [submitting, withLoading] = useLoading();
    const dispatch = useDispatch();
    const handleError = useErrorHandler();

    const handleSubmit = async () => {
        await dispatch(
            renameInternalAddressThunk({
                address,
                newEmail,
                localEmail: localEmail !== initialLocalEmail ? localEmail : undefined,
                displayName: displayName !== initialDisplayName ? displayName : undefined,
            })
        );
        createNotification({ text: c('Success').t`Email address updated` });
        rest.onClose?.();
    };

    const handleClose = submitting ? undefined : rest.onClose;

    return (
        <Modal
            as="form"
            size="medium"
            {...rest}
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                event.stopPropagation();
                if (!onFormSubmit()) {
                    return;
                }
                withLoading(handleSubmit()).catch(handleError);
            }}
            onClose={handleClose}
            noValidate
        >
            <ModalHeader title={c('Title').t`Edit email address`} />
            <ModalContent>
                <div className="color-weak mb-4">{c('loc_nightly_Info')
                    .t`You can change capitalization or punctuation to edit your email address.`}</div>
                <InputFieldTwo
                    type="email"
                    autoComplete="email"
                    id="email"
                    autoFocus
                    value={localEmail}
                    suffix={
                        <span className="text-ellipsis" title={`@${domain}`}>
                            @{domain}
                        </span>
                    }
                    onValue={setEmail}
                    error={validator([
                        requiredValidator(localEmail),
                        emailValidator(newEmail),
                        (() => {
                            if (
                                canonicalizeEmail(newEmail, CANONICALIZE_SCHEME.PROTON) !==
                                canonicalizeEmail(initialEmail, CANONICALIZE_SCHEME.PROTON)
                            ) {
                                return c('loc_nightly_Error')
                                    .t`Only capitalization and punctuation (periods, hyphens, and underscores) can be changed for this address`;
                            }
                            return '';
                        })(),
                    ])}
                    label={c('Label').t`Address`}
                />
                <InputFieldTwo
                    id="displayName"
                    value={displayName}
                    onValue={setDisplayName}
                    label={c('Label').t`Display name`}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={submitting}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={submitting}>{c('Action').t`Save`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default EditInternalAddressModal;
