import React from 'react';

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
} from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import type { UseRemoveDeviceModalState } from './useRemoveDeviceModalState';

export type RemoveDeviceModalViewProps = UseRemoveDeviceModalState;
export const RemoveDeviceModalView = ({
    model,
    setModel,
    submitting,
    handleSubmit,
    deviceNameValidation,
    deviceName: name,
    onClose,
    ...modalProps
}: RemoveDeviceModalViewProps) => {
    const deviceName = <strong className="text-break">{name}</strong>;

    return (
        <ModalTwo
            as={Form}
            disableCloseOnEscape={submitting}
            onClose={onClose}
            onReset={onClose}
            onSubmit={handleSubmit}
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
