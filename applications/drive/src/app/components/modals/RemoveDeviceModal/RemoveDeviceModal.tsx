import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import {
    Form,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Row,
    useFormErrors,
    useModalTwoStatic,
} from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import { useLoading } from '@proton/hooks';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import useFlag from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { RemoveDeviceModal } from '../../../modals/RemoveDeviceModal';
import type { Device } from '../../../store';
import { useActions } from '../../../store';

interface Props {
    onClose?: () => void;
    device: Device;
}

export const deviceNameValidator = (value: string, deviceName: string) =>
    value !== deviceName ? c('Error').t`Device name does not match` : '';

export const RemoveDeviceModalDeprecated = ({ device, onClose, ...modalProps }: Props) => {
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
            size="small"
            {...modalProps}
        >
            <ModalTwoHeader closeButtonProps={{ disabled: submitting }} title={c('Title').t`Remove device?`} />
            <ModalTwoContent>
                <p key={'remove-device-modal-content-paragraph-1'}>
                    {c('Info')
                        .jt`When you remove ${deviceName} as a synced device, all folders added to My Computers from this device will be permanently deleted from ${DRIVE_APP_NAME}.`}
                </p>
                <p key={'remove-device-modal-content-paragraph-1'}>
                    {c('Info')
                        .jt`If those files are not fully downloaded locally on ${deviceName} you will lose access to them.`}
                </p>
                <p key={'remove-device-modal-content-paragraph-2'}>
                    {c('Info').t`This can NOT be undone. Please enter the device name to confirm removal.`}
                </p>
                <Row className="my-4">
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

export const useRemoveDeviceModal = () => {
    const shouldUseSDK = useFlag('DriveWebSDKDevices');

    return useModalTwoStatic(({ device, ...modalProps }: Props & ModalStateProps) => {
        if (shouldUseSDK) {
            const uid = generateNodeUid(device.volumeId, device.linkId);
            return <RemoveDeviceModal deviceUid={uid} deviceName={device.name} {...modalProps} />;
        }

        return <RemoveDeviceModalDeprecated device={device} {...modalProps} />;
    });
};
