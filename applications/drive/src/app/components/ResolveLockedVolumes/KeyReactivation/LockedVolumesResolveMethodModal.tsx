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
import { APPS } from '@proton/shared/lib/constants';
import { c, msgid } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { LockedVolumeResolveMethod } from './interfaces';

const appName = getAppName(APPS.PROTONDRIVE);

interface Props {
    defaultResolveMethod: LockedVolumeResolveMethod;
    onClose?: () => void;
    onSubmit?: (type: LockedVolumeResolveMethod) => void;
    volumeCount: number;
}

const OptionLabel = ({ title, info }: { title: string; info: string }) => {
    return (
        <div className="ml0-5">
            <span className="text-bold">{title}</span>
            <p className="m0 color-weak">{info}</p>
        </div>
    );
};

const BrElement = <br />;

const KeyReactivationModal = ({
    onClose = noop,
    onSubmit = noop,
    defaultResolveMethod,
    volumeCount,
    ...rest
}: Props) => {
    const [radioGroupValue, setRadioGroupValue] = useState<number>(
        defaultResolveMethod || LockedVolumeResolveMethod.ReactivateKeys
    );

    const handleChange = (payload: LockedVolumeResolveMethod) => {
        setRadioGroupValue(payload);
    };

    const modalTitleID = 'KeyReactivationModal';

    const questionText = <strong>{c('Info').t`What would you like to do?`}</strong>;
    const infoText = c('Info')
        .jt`One of your encrypted drives is locked. This is most likely due to a recent password reset.${BrElement}
        ${BrElement}
        ${questionText}`;

    const deleteDriveLabelText = c('Info').ngettext(msgid`Delete drive`, `Delete drives`, volumeCount);

    const radioOptions = [
        {
            label: (
                <OptionLabel
                    title={c('Label').t`Unlock drive (recommended)`}
                    info={c('Info').t`Unlock drive to recover files`}
                />
            ),
            value: LockedVolumeResolveMethod.ReactivateKeys,
        },
        {
            label: (
                <OptionLabel
                    title={c('Label').t`Unlock later`}
                    info={c('Info').t`Continue using ${appName} and unlock drive later`}
                />
            ),
            value: LockedVolumeResolveMethod.UnlockLater,
        },
        {
            label: (
                <OptionLabel
                    title={deleteDriveLabelText}
                    info={c('Info').t`Permanently delete all files in your drive`}
                />
            ),
            value: LockedVolumeResolveMethod.DeleteOldFiles,
        },
    ];

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} small {...rest}>
            <HeaderModal hasClose displayTitle noEllipsis modalTitleID={modalTitleID} onClose={onClose}>
                {c('Action').t`Drive Locked`}
            </HeaderModal>
            <ContentModal onReset={noop} onSubmit={() => onSubmit(radioGroupValue)}>
                <InnerModal className="mb1">
                    <p className="mt0">{infoText}</p>
                    <RadioGroup
                        options={radioOptions}
                        value={radioGroupValue}
                        onChange={handleChange}
                        name="action-type"
                        className="flex-nowrap mb1"
                    />
                </InnerModal>
                <FooterModal>
                    <Button color="norm" type="submit" data-testid="drive-key-reactivations-options:continue">
                        {c('Action').t`Continue`}
                    </Button>
                </FooterModal>
            </ContentModal>
        </DialogModal>
    );
};
export default KeyReactivationModal;
