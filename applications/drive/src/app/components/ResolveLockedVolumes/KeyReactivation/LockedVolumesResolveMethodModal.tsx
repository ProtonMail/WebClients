import React, { useState } from 'react';
import { Button, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, RadioGroup } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { c, msgid } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { LockedVolumeResolveMethod } from './interfaces';
import { useModal } from '../../../hooks/util/useModal';

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
    const { isOpen, onClose: handleClose } = useModal(onClose);

    const handleChange = (payload: LockedVolumeResolveMethod) => {
        setRadioGroupValue(payload);
    };

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
        <ModalTwo
            onClose={handleClose}
            onReset={handleClose}
            onSubmit={(e: any) => {
                e.preventDefault();
                onSubmit(radioGroupValue);
            }}
            size="small"
            open={isOpen}
            {...rest}
            as="form"
        >
            <ModalTwoHeader title={c('Action').t`Drive Locked`} />
            <ModalTwoContent onReset={noop} onSubmit={() => onSubmit(radioGroupValue)}>
                <p className="mt0">{infoText}</p>
                <RadioGroup
                    options={radioOptions}
                    value={radioGroupValue}
                    onChange={handleChange}
                    name="action-type"
                    className="flex-nowrap mb1"
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset">{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" data-testid="drive-key-reactivations-options:continue">
                    {c('Action').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
export default KeyReactivationModal;
