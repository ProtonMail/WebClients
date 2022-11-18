import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Form,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Row,
    useFormErrors,
    useLoading,
} from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import { Device, useActions } from '../../store';

interface Props {
    onClose?: () => void;
    device: Device;
    open?: boolean;
}

export const deviceNameValidator = (value: string, deviceName: string) =>
    value !== deviceName ? c('Error').t`Device name does not match` : '';

const RemoveDeviceModal = ({ device, onClose, open }: Props) => {
    const { removeDevice } = useActions();
    const [submitting, withSubmitting] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();
    const [model, setModel] = useState(() => {
        return {
            name: '',
        };
    });

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        return removeDevice(device.id, new AbortController().signal).then(() => {
            onClose?.();
        });
    };

    const deviceNameValidation = validator([
        requiredValidator(model.name),
        deviceNameValidator(model.name, device.name),
    ]);

    const deviceName = <strong className="text-break">{device.name}</strong>;

    return (
        <ModalTwo
            as={Form}
            disableCloseOnEscape={submitting}
            onClose={onClose}
            onReset={onClose}
            onSubmit={() => withSubmitting(handleSubmit()).catch(noop)}
            open={open}
            size="small"
        >
            <ModalTwoHeader closeButtonProps={{ disabled: submitting }} title={c('Title').t`Remove device?`} />
            <ModalTwoContent>
                <p>
                    {c('Info')
                        .jt`This will remove from ${DRIVE_APP_NAME} the synced device ${deviceName}. Local files on
                    the device won’t be affected.`}
                </p>
                <p>Enter the device name to confirm removal.</p>
                <Row className="mt1 mb1">
                    <InputFieldTwo
                        aria-required
                        autoFocus
                        label={c('Label').t`Device name`}
                        placeholder={c('Placeholder').t`Enter device name`}
                        title={c('Label').t`Enter device name`}
                        error={deviceNameValidation}
                        value={model.name}
                        onValue={(value: string) => setModel({ name: value })}
                    />
                </Row>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose} disabled={submitting}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button type="submit" loading={submitting} color="danger">
                    {c('Action').t`Remove device`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default RemoveDeviceModal;
