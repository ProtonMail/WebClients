import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { updateAddressThunk } from '@proton/account/addresses/updateAddress';
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
import type { Address } from '@proton/shared/lib/interfaces';

interface Props extends ModalProps<'form'> {
    address: Address;
}

const EditDisplayNameModal = ({ address, ...rest }: Props) => {
    const [initialDisplayName] = useState(address.DisplayName);
    const [displayName, setDisplayName] = useState('');
    const { createNotification } = useNotifications();
    const { onFormSubmit } = useFormErrors();
    const [submitting, withLoading] = useLoading();
    const dispatch = useDispatch();
    const handleError = useErrorHandler();

    const handleSubmit = async () => {
        try {
            await dispatch(updateAddressThunk({ address, displayName }));
            createNotification({ text: c('Success').t`Display name updated` });
            rest.onClose?.();
        } catch (e) {
            handleError(e);
        }
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
                void withLoading(handleSubmit());
            }}
            onClose={handleClose}
        >
            <ModalHeader title={c('Title').t`Edit display name`} />
            <ModalContent>
                {initialDisplayName && (
                    <div className="mb-6">
                        <div className="text-semibold mb-1">{c('Label').t`Current display name`}</div>
                        <div className="text-ellipsis" title={initialDisplayName}>
                            {initialDisplayName}
                        </div>
                    </div>
                )}
                <InputFieldTwo
                    id="displayName"
                    autoFocus
                    value={displayName}
                    maxLength={255}
                    onValue={setDisplayName}
                    label={c('Label').t`New display name`}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={submitting}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={submitting}>{c('Action').t`Save`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default EditDisplayNameModal;
