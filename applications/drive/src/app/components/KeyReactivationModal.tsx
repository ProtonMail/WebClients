import React, { useState } from 'react';
import {
    Button,
    ButtonLike,
    ContentModal,
    DialogModal,
    FooterModal,
    HeaderModal,
    InnerModal,
    RadioGroup,
    SettingsLink,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';

const INFO_TEXT = c('Action').t`In order to access your files, \
you need to reactivate encryption key

You are also able to delete all of your old files`;

interface Props {
    onClose?: () => void;
    onSubmit?: (event: { type: ReactivationOptions }) => void;
}

export enum ReactivationOptions {
    ReactivateKeys,
    DeleteOldFiles,
}

const OptionLabel = ({ title, info }: { title: string; info: string }) => {
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

const KeyReactivationModal = ({ onClose = noop, onSubmit = noop, ...rest }: Props) => {
    const [radioGroupValue, setRadioGroupValue] = useState<number>(ReactivationOptions.ReactivateKeys);

    const handleChange = (payload: ReactivationOptions) => {
        setRadioGroupValue(payload);
    };

    const modalTitleID = 'KeyReactivationModal';

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} small {...rest}>
            <HeaderModal hasClose displayTitle noEllipsis modalTitleID={modalTitleID} onClose={onClose}>
                {c('Action').t`Key re-activation`}
            </HeaderModal>
            <ContentModal onReset={onClose} onSubmit={() => onSubmit({ type: radioGroupValue })}>
                <InnerModal className="mb1">
                    <p className="mt0">{INFO_TEXT}</p>
                    <RadioGroup
                        options={radioOptions}
                        value={radioGroupValue}
                        onChange={handleChange}
                        name="action-type"
                    />
                </InnerModal>
                <FooterModal>
                    <Button
                        color="weak"
                        type="button"
                        onClick={onClose}
                        data-test-id="drive-key-reactivation-options:cancel"
                    >
                        {c('Action').t`Decide later`}
                    </Button>
                    {radioGroupValue === ReactivationOptions.ReactivateKeys ? (
                        <ButtonLike
                            as={SettingsLink}
                            type="submit"
                            color="norm"
                            path="/encryption-keys?action=reactivate#addresses"
                            app={APPS.PROTONMAIL}
                            data-test-id="drive-key-reactivations-options:continue"
                        >
                            {c('Action').t`Continue`}
                        </ButtonLike>
                    ) : (
                        <Button color="norm" type="submit" data-test-id="drive-key-reactivations-options:continue">
                            {c('Action').t`Continue`}
                        </Button>
                    )}
                </FooterModal>
            </ContentModal>
        </DialogModal>
    );
};
export default KeyReactivationModal;
