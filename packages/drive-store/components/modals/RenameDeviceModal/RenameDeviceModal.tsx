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
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import type { Device } from '../../../store';
import { useActions } from '../../../store';

interface Props {
    onClose?: () => void;
    device: Device;
}

const RenameDeviceModal = ({ device, onClose, ...modalProps }: Props & ModalStateProps) => {
    const { renameDevice } = useActions();
    const [submitting, withSubmitting] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();
    const [model, setModel] = useState(() => {
        return {
            name: device.name,
        };
    });

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        await renameDevice({
            shareId: device.shareId,
            linkId: device.linkId,
            deviceId: device.id,
            newName: model.name,
            haveLegacyName: device.haveLegacyName,
        });

        onClose?.();
    };

    const deviceNameValidation = validator([requiredValidator(model.name)]);

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
                        value={model.name}
                        onValue={(value: string) => setModel({ name: value })}
                    />
                </Row>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose} disabled={submitting}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button type="submit" loading={submitting} disabled={device.name === model.name} color="norm">
                    {c('Action').t`Rename`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default RenameDeviceModal;
export const useRenameDeviceModal = () => {
    return useModalTwoStatic(RenameDeviceModal);
};
