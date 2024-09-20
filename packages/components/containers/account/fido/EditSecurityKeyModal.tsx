import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { useLoading } from '@proton/hooks';
import { renameSecurityKey } from '@proton/shared/lib/api/settings';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { useApi, useErrorHandler, useEventManager, useNotifications } from '../../../hooks';
import { maxSecurityKeyNameLength } from './constants';

interface Props extends ModalProps {
    id: string;
    name: string;
}

const EditSecurityKeyModal = ({ id, name, onClose, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const normalApi = useApi();
    const errorHandler = useErrorHandler();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const { call } = useEventManager();
    const { validator, onFormSubmit } = useFormErrors();
    const [newName, setNewName] = useState(name);
    const { createNotification } = useNotifications();

    const handleUpdate = () => {
        const run = async () => {
            try {
                await silentApi(renameSecurityKey(id, { Name: newName }));
                await call();
                createNotification({
                    text: c('fido2: Info').t`Security key updated`,
                });
                onClose?.();
            } catch (e) {
                errorHandler(e);
                return;
            }
        };
        withLoading(run());
    };

    return (
        <Modal
            as={Form}
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
                if (!onFormSubmit(event.currentTarget)) {
                    return;
                }
                handleUpdate();
            }}
            onClose={onClose}
            size="small"
            {...rest}
        >
            <ModalHeader title={c('fido2: Title').t`Name your security key`} />
            <ModalContent>
                <InputFieldTwo
                    autoFocus
                    maxLength={maxSecurityKeyNameLength}
                    label={c('fido2: Label').t`Key name`}
                    error={validator([requiredValidator(newName)])}
                    value={newName}
                    onValue={setNewName}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button loading={loading} type="submit" color="norm">
                    {c('Action').t`Save`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default EditSecurityKeyModal;
