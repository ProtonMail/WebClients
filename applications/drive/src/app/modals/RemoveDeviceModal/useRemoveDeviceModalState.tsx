import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { type ModalStateProps, useFormErrors, useNotifications } from '@proton/components';
import type { ProtonDriveClient } from '@proton/drive';
import { getDrive } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getDeviceByUid } from '../../utils/sdk/getDeviceByUid';
import { getDeviceName } from '../../utils/sdk/getNodeName';

export const deviceNameValidator = (value: string, deviceName: string) =>
    value !== deviceName ? c('Error').t`Device name does not match` : '';

export type UseRemoveDeviceInnerProps = {
    deviceUid: string;
    drive?: ProtonDriveClient;
    onClose?: () => void;
};
export type UseRemoveDeviceModalProps = ModalStateProps & UseRemoveDeviceInnerProps;

export const useRemoveDeviceModalState = ({
    deviceUid,
    drive = getDrive(),
    onClose,
    ...modalProps
}: UseRemoveDeviceModalProps) => {
    const { createNotification } = useNotifications();
    const [submitting, withSubmitting] = useLoading();
    const [deviceName, setDeviceName] = useState<string>('');
    const { validator, onFormSubmit } = useFormErrors();
    const [model, setModel] = useState(() => {
        return {
            name: '',
        };
    });

    useEffect(() => {
        const getDeviceFromUid = async () => {
            const device = await getDeviceByUid(deviceUid);
            if (device) {
                setDeviceName(getDeviceName(device));
            }
        };

        void getDeviceFromUid();
    }, [deviceUid, drive]);

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }
        const successNotificationText = c('Notification').t`Device removed`;
        const unhandledErrorNotificationText = c('Notification').t`Failed to remove device`;
        await getBusDriver().emit({ type: BusDriverEventName.REMOVED_DEVICES, deviceUids: [deviceUid] });
        await drive
            .deleteDevice(deviceUid)
            .then(async () => {
                createNotification({ text: successNotificationText });
            })
            .catch((e) => {
                handleSdkError(e, { fallbackMessage: unhandledErrorNotificationText, extra: { deviceUid } });
            });

        onClose?.();
    };

    const deviceNameValidation = validator([
        requiredValidator(model.name),
        deviceNameValidator(model.name, deviceName),
    ]);

    return {
        model,
        setModel,
        submitting,
        handleSubmit: () => withSubmitting(handleSubmit()),
        deviceNameValidation,
        deviceName,
        onClose,
        ...modalProps,
    };
};

export type UseRemoveDeviceModalState = ReturnType<typeof useRemoveDeviceModalState>;
