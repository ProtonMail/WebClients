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
import { renameInternalAddress, updateAddress } from '@proton/shared/lib/api/addresses';
import { CANONICALIZE_SCHEME, canonicalizeEmail, getEmailParts } from '@proton/shared/lib/helpers/email';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Address } from '@proton/shared/lib/interfaces';
import { getRenamedAddressKeys } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { InputFieldTwo, useFormErrors } from '../../components';
import { useApi, useEventManager, useGetOrganizationKey, useGetUserKeys, useNotifications } from '../../hooks';

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
    const getUserKeys = useGetUserKeys();
    const getOrganizationKey = useGetOrganizationKey();
    const { createNotification } = useNotifications();
    const { onFormSubmit, validator } = useFormErrors();
    const [submitting, withLoading] = useLoading();
    const api = useApi();
    const { call } = useEventManager();

    const handleSubmit = async () => {
        if (localEmail !== initialLocalEmail) {
            const userKeys = await getUserKeys();
            const organizationKey = await getOrganizationKey();
            await api(
                renameInternalAddress(address.ID, {
                    Local: localEmail,
                    AddressKeys: await getRenamedAddressKeys({
                        userKeys,
                        addressKeys: address.Keys,
                        organizationKey: organizationKey?.privateKey ? organizationKey : undefined,
                        email: newEmail,
                    }),
                })
            );
        }
        if (displayName !== initialDisplayName) {
            await api(
                updateAddress(address.ID, {
                    DisplayName: displayName,
                    Signature: address.Signature,
                })
            ).catch(noop);
        }
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
