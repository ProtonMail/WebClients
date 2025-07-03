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

import type { UseRenameDeviceModalState } from './useRenameDeviceModalState';

export type RenameDeviceModalViewProps = UseRenameDeviceModalState;

export const RenameDeviceModalView = ({
    inputName,
    setInputName,
    submitting,
    handleSubmit,
    deviceNameValidation,
    deviceName,
    onClose,
    ...modalProps
}: RenameDeviceModalViewProps) => {
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
            <ModalTwoHeader closeButtonProps={{ disabled: submitting }} title={c('Title').t`Rename device`} />
            <ModalTwoContent>
                <Row className="my-4">
                    <InputFieldTwo
                        aria-required
                        autoFocus
                        label={c('Label').t`Device name`}
                        placeholder={c('Placeholder').t`Enter device name`}
                        title={c('Label').t`Enter device name`}
                        error={deviceNameValidation}
                        value={inputName}
                        onValue={(value: string) => setInputName(value)}
                    />
                </Row>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose} disabled={submitting}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button type="submit" loading={submitting} disabled={deviceName === inputName} color="norm">
                    {c('Action').t`Rename`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
