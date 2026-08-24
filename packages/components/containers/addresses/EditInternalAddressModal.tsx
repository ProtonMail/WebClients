import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { renameInternalAddressThunk } from '@proton/account/addresses/renameInternalAddress';
import { useCustomDomains } from '@proton/account/domains/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CANONICALIZE_SCHEME, canonicalizeEmail, getEmailParts } from '@proton/shared/lib/helpers/email';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Address, Member } from '@proton/shared/lib/interfaces';

import type { ModalProps } from '../../components/modalTwo/Modal';
import Modal from '../../components/modalTwo/Modal';
import ModalContent from '../../components/modalTwo/ModalContent';
import ModalFooter from '../../components/modalTwo/ModalFooter';
import ModalHeader from '../../components/modalTwo/ModalHeader';
import InputFieldTwo from '../../components/v2/field/InputField';
import useFormErrors from '../../components/v2/useFormErrors';
import useErrorHandler from '../../hooks/useErrorHandler';
import useNotifications from '../../hooks/useNotifications';

interface Props extends ModalProps<'form'> {
    address: Address;
    member?: Member;
}

const EditInternalAddressModal = ({ address, member, ...rest }: Props) => {
    const [customDomains] = useCustomDomains();
    const [initialEmail] = useState(address.Email);
    const [initialLocalEmail, parsedDomain] = getEmailParts(initialEmail);
    const customDomain = customDomains?.find(({ ID }) => ID === address.DomainID);
    const domain = customDomain?.DomainName ?? parsedDomain;
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
        const hasEmailChanged = newEmail !== initialEmail;
        const hasDisplayNameChanged = displayName !== initialDisplayName;

        await dispatch(
            renameInternalAddressThunk({
                member,
                address,
                newEmail,
                localEmail: hasEmailChanged ? localEmail : undefined,
                displayName: hasDisplayNameChanged ? displayName : undefined,
            })
        );
        if (hasEmailChanged || hasDisplayNameChanged) {
            createNotification({ text: c('Success').t`Email address updated` });
        }
        rest.onClose?.();
    };

    const handleClose = submitting ? undefined : rest.onClose;
    const isSelf = !member || Boolean(member.Self);

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
                <div className="color-weak mb-4">
                    {c('Info')
                        .t`Only capitalization and punctuation (periods, hyphens, and underscores) can be changed here. To use a different address, add a new one.`}
                </div>
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
                                return c('Error')
                                    .t`Only capitalization and punctuation (periods, hyphens, and underscores) can be changed for this address`;
                            }
                            return '';
                        })(),
                    ])}
                    label={c('Label').t`Address`}
                />
                {isSelf /* API route to update display name only exists for self */ && (
                    <InputFieldTwo
                        id="displayName"
                        value={displayName}
                        onValue={setDisplayName}
                        label={c('Label').t`Display name`}
                    />
                )}
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={submitting}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={submitting}>{c('Action').t`Save`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default EditInternalAddressModal;
