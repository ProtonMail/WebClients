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

export type UseRenameDeviceInnerProps = {
    deviceUid: string;
    drive?: ProtonDriveClient;
    onClose?: () => void;
};

export type UseRenameDeviceModalProps = ModalStateProps & UseRenameDeviceInnerProps;

export const useRenameDeviceModalState = ({
    deviceUid,
    drive = getDrive(),
    onClose,
    ...modalProps
}: UseRenameDeviceModalProps) => {
    const [submitting, withSubmitting] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();
    const { createNotification } = useNotifications();

    const [deviceName, setDeviceName] = useState<string>('');
    const [inputName, setInputName] = useState('');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const getDeviceFromUid = async () => {
            try {
                const device = await getDeviceByUid(deviceUid);
                if (device) {
                    setDeviceName(getDeviceName(device));
                    setInputName(getDeviceName(device));
                }
            } catch (e) {
                handleSdkError(e, {
                    showNotification: true,
                    fallbackMessage: c('Error').t`Can't retrieve device name`,
                });
            } finally {
                setIsReady(true);
            }
        };

        void getDeviceFromUid();
    }, [deviceUid]);

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        const successNotificationText = c('Notification').t`Device renamed`;
        const unhandledErrorNotificationText = c('Notification').t`Failed to rename device`;
        await getBusDriver().emit({
            type: BusDriverEventName.RENAMED_DEVICES,
            items: [{ deviceUid: deviceUid, newName: inputName }],
        });
        await drive
            .renameDevice(deviceUid, inputName)
            .then(async () => {
                createNotification({ text: successNotificationText });
            })
            .catch((e) => {
                handleSdkError(e, { fallbackMessage: unhandledErrorNotificationText, extra: { deviceUid } });
            });

        onClose?.();
    };

    const deviceNameValidation = validator([requiredValidator(inputName)]);

    return {
        inputName,
        setInputName,
        submitting,
        isReady,
        handleSubmit: () => withSubmitting(handleSubmit()),
        deviceNameValidation,
        onClose,
        deviceName,
        ...modalProps,
    };
};

export type UseRenameDeviceModalState = ReturnType<typeof useRenameDeviceModalState>;
