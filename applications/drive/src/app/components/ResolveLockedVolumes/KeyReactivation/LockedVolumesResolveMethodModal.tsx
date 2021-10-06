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
            <p className="m0">{info}</p>
        </div>
    );
};

export enum LockedVolumeResolveMethod {
    ResolveMethodSelection,
    DeleteOldFiles,
    UnlockLater,
    ReactivateKeys,
}

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
    // TODO: There's no link nor article yet
    // const LearnMoreLink = null;

    const INFO_TEXT = c('Info').ngettext(
        msgid`We are unable to unlock one of your encrypted drive.
            This is most likely due to a recent password reset.`,
        `We are unable to unlock one of your encrypted drives.
            This is most likely due to a recent password reset.`,
        volumeCount
    );
    const deleteDriveLabelText = c('Info').ngettext(msgid`Delete Drive`, `Delete Drives`, volumeCount);

    const radioOptions = [
        {
            label: (
                <OptionLabel
                    title={c('Label').t`Unlock Drive (Recommended)`}
                    info={c('Info').t`Recover the locked Drive.`}
                />
            ),
            value: LockedVolumeResolveMethod.ReactivateKeys,
        },
        {
            label: (
                <OptionLabel
                    title={c('Label').t`Unlock later`}
                    info={c('Info').t`Continue using ${appName} and recover the locked Drive later.`}
                />
            ),
            value: LockedVolumeResolveMethod.UnlockLater,
        },
        {
            label: (
                <OptionLabel
                    title={deleteDriveLabelText}
                    info={c('Info').t`The locked Drive and all files in it will be deleted.`}
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
                    <p className="mt0">{INFO_TEXT}</p>
                    <RadioGroup
                        options={radioOptions}
                        value={radioGroupValue}
                        onChange={handleChange}
                        name="action-type"
                        className="flex-nowrap"
                    />
                </InnerModal>
                <FooterModal>
                    <Button color="norm" type="submit" data-test-id="drive-key-reactivations-options:continue">
                        {c('Action').t`Continue`}
                    </Button>
                </FooterModal>
            </ContentModal>
        </DialogModal>
    );
};
export default KeyReactivationModal;
