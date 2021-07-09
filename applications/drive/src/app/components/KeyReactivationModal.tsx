import React, { useState } from 'react';
import {
    Button,
    ContentModal,
    DialogModal,
    FooterModal,
    HeaderModal,
    InnerModal,
    RadioGroup,
} from '@proton/components';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';

const INFO_TEXT = c('Action').t`In order to access your files, \
you need to reactivate encryption key

You are also able to delete all of your old files`;

interface Props {
    onClose?: () => void;
    onSubmit?: () => void;
}

export enum ReactivationOptions {
    ReactivateKeys,
    DeleteOldFiles,
}

const OptionLabel = ({ title, info }) => {
    return (
        <div className="ml0-5">
            <span className="text-bold">{title}</span>
            <p className="m0">{info}</p>
        </div>
    );
};

const radioOptions = [
    {
        label: (
            <OptionLabel
                title={c('Label').t`Re-activate keys`}
                info={c('Info').t`The existing files will be restored`}
            />
        ),
        value: ReactivationOptions.ReactivateKeys,
    },
    {
        label: (
            <OptionLabel
                title={c('Label').t`Delete old files`}
                info={c('Info').t`The old files will be deleted forever`}
            />
        ),
        value: ReactivationOptions.DeleteOldFiles,
    },
];

// TODO: data-test-id="calendar-toolbar:previous"
const KeyReactivationModal = ({ onClose = noop, onSubmit, ...rest }: Props) => {
    const [radioGroupValue, setRadioGroupValue] = useState<number>();

    const handleChange = (payload) => {
        setRadioGroupValue(payload);
    };

    const modalTitleID = 'KeyReactivationModal';

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} small {...rest}>
            <HeaderModal hasClose displayTitle noEllipsis modalTitleID={modalTitleID} onClose={onClose}>
                {c('Action').t`Key re-activation`}
            </HeaderModal>
            <ContentModal onReset={onClose}>
                <InnerModal className="mb1">
                    <p className="mt0">{INFO_TEXT}</p>
                    <RadioGroup options={radioOptions} value={radioGroupValue} onChange={handleChange} />
                </InnerModal>
                <FooterModal>
                    <Button color="weak" type="button" onClick={onClose}>
                        {c('Action').t`Decide later`}
                    </Button>
                    <Button
                        color="norm"
                        type="button"
                        onClick={() => onSubmit({ type: radioGroupValue })}
                        disabled={radioGroupValue === undefined}
                    >
                        {c('Action').t`Continue`}
                    </Button>
                </FooterModal>
            </ContentModal>
        </DialogModal>
    );
};

export default KeyReactivationModal;
