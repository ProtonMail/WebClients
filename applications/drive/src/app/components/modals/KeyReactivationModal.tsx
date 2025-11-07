import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components';
import {
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    RadioGroup,
    useModalTwoStatic,
} from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { LockedVolumeResolveMethod } from '../ResolveLockedVolumes/KeyReactivation/interfaces';

interface Props {
    defaultResolveMethod: LockedVolumeResolveMethod;
    onClose?: () => void;
    onSubmit?: (type: LockedVolumeResolveMethod) => void;
    volumeCount: number;
}

const OptionLabel = ({ title, info }: { title: string; info: string }) => {
    return (
        <div className="ml-2">
            <span className="text-bold">{title}</span>
            <p className="m-0 color-weak">{info}</p>
        </div>
    );
};

const KeyReactivationModal = ({
    onClose,
    onSubmit = noop,
    defaultResolveMethod,
    volumeCount,
    ...modalProps
}: Props & ModalStateProps) => {
    const [radioGroupValue, setRadioGroupValue] = useState<number>(
        defaultResolveMethod || LockedVolumeResolveMethod.ReactivateKeys
    );

    const handleChange = (payload: LockedVolumeResolveMethod) => {
        setRadioGroupValue(payload);
    };

    const questionText = <strong>{c('Info').t`What would you like to do?`}</strong>;
    const infoText = c('Info')
        .jt`One of your encrypted drives is locked. This is most likely due to a recent password reset.`;

    const deleteDriveLabelText = c('Info').ngettext(msgid`Delete locked drive`, `Delete locked drives`, volumeCount);

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
                    info={c('Info').t`Continue using ${DRIVE_APP_NAME} and unlock drive later`}
                />
            ),
            value: LockedVolumeResolveMethod.UnlockLater,
        },
        {
            label: (
                <OptionLabel
                    title={deleteDriveLabelText}
                    info={c('Info').t`Permanently delete all files in your locked drive`}
                />
            ),
            value: LockedVolumeResolveMethod.DeleteOldFiles,
        },
    ];
    return (
        <ModalTwo
            onClose={onClose}
            onReset={onClose}
            onSubmit={(e: any) => {
                e.preventDefault();
                onSubmit(radioGroupValue);
                if (radioGroupValue === LockedVolumeResolveMethod.UnlockLater) {
                    onClose();
                }
            }}
            size="small"
            as="form"
            {...modalProps}
        >
            <ModalTwoHeader title={c('Action').t`Drive Locked`} />
            <ModalTwoContent onReset={noop} onSubmit={() => onSubmit(radioGroupValue)}>
                <p className="mt-0 mb-2">{infoText}</p>
                <p className="mt-2">{questionText}</p>
                <RadioGroup
                    options={radioOptions}
                    value={radioGroupValue}
                    onChange={handleChange}
                    name="action-type"
                    className="flex-nowrap mb-4"
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

export const useKeyReactivationModal = () => {
    return useModalTwoStatic(KeyReactivationModal);
};
