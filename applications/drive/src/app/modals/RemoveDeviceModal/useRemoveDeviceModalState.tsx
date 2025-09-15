import { useState } from 'react';

import { c } from 'ttag';

import { type ModalStateProps, useFormErrors, useNotifications } from '@proton/components';
import { useDrive } from '@proton/drive';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';

export const deviceNameValidator = (value: string, deviceName: string) =>
    value !== deviceName ? c('Error').t`Device name does not match` : '';

export type UseRemoveDeviceInnerProps = {
    deviceUid: string;
    deviceName: string;
    onClose?: () => void;
    onSubmit?: () => void;
};
export type UseRemoveDeviceModalProps = ModalStateProps & UseRemoveDeviceInnerProps;

export const useRemoveDeviceModalState = ({
    deviceUid,
    deviceName,
    onClose,
    onSubmit,
    ...modalProps
}: UseRemoveDeviceModalProps) => {
    const { drive } = useDrive();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();
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
        const successNotificationText = c('Notification').t`Device removed`;
        const unhandledErrorNotificationText = c('Notification').t`Failed to remove device`;
        onSubmit?.();
        await drive
            .deleteDevice(deviceUid)
            .then(async () => {
                createNotification({ text: successNotificationText });
            })
            .catch((e) => {
                handleError(e, { fallbackMessage: unhandledErrorNotificationText, extra: { deviceUid } });
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
