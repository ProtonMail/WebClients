import { useState } from 'react';

import { c } from 'ttag';

import { type ModalStateProps, useFormErrors, useNotifications } from '@proton/components';
import { useDrive } from '@proton/drive';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { useDeviceStore } from '../../sections/devices/devices.store';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';

export type UseRenameDeviceModalProps = ModalStateProps & {
    deviceUid: string;
    deviceName: string;
    onClose?: () => void;
};

export const useRenameDeviceModalState = ({
    deviceUid,
    deviceName,
    onClose,
    ...modalProps
}: UseRenameDeviceModalProps) => {
    const [submitting, withSubmitting] = useLoading();
    const { drive } = useDrive();
    const { validator, onFormSubmit } = useFormErrors();
    const { createNotification } = useNotifications();
    const { renameDevice } = useDeviceStore();

    const { handleError } = useSdkErrorHandler();
    const [inputName, setInputName] = useState(() => deviceName);

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        const successNotificationText = c('Notification').t`Device renamed`;
        const unhandledErrorNotificationText = c('Notification').t`Failed to rename device`;

        await drive
            .renameDevice(deviceUid, inputName)
            .then(async () => {
                renameDevice(deviceUid, inputName);
                createNotification({ text: successNotificationText });
            })
            .catch((e) => {
                handleError(e, { fallbackMessage: unhandledErrorNotificationText, extra: { deviceUid } });
            });

        onClose?.();
    };

    const deviceNameValidation = validator([requiredValidator(inputName)]);

    return {
        inputName,
        setInputName,
        submitting,
        handleSubmit: () => withSubmitting(handleSubmit()),
        deviceNameValidation,
        onClose,
        deviceName,
        ...modalProps,
    };
};

export type UseRenameDeviceModalState = ReturnType<typeof useRenameDeviceModalState>;
