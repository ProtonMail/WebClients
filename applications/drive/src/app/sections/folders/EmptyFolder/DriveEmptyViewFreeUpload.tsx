import { useEffect } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { ButtonWithTextAndIcon, Icon, ListItemGreenTick, useActiveBreakpoint } from '@proton/components';
import { VintageClock } from '@proton/components/components/vintageClock/VintageClock';
import { toMinutesAndSeconds } from '@proton/shared/lib/helpers/time';
import clsx from '@proton/utils/clsx';

import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { useFileUploadInput, useFolderUploadInput } from '../../../store';
import { useFreeUploadStore } from '../../../zustand/freeUpload/freeUpload.store';

export function DriveEmptyViewFreeUpload() {
    const { viewportWidth } = useActiveBreakpoint();

    const { secondsLeft, setBigCounterVisible } = useFreeUploadStore(
        useShallow((state) => ({
            secondsLeft: state.secondsLeft,
            setBigCounterVisible: state.setBigCounterVisible,
        }))
    );
    const [minutes, seconds] = toMinutesAndSeconds(secondsLeft);

    useEffect(() => {
        setBigCounterVisible(true);
        return () => setBigCounterVisible(false);
    }, [setBigCounterVisible]);

    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick: fileClick,
        handleChange: fileChange,
    } = useFileUploadInput(activeFolder.volumeId, activeFolder.shareId, activeFolder.linkId);
    const {
        inputRef: folderInput,
        handleClick: folderClick,
        handleChange: folderChange,
    } = useFolderUploadInput(activeFolder.volumeId, activeFolder.shareId, activeFolder.linkId);

    const freeUploadLength = <FreeUploadLength key="freeUploadLength" />;

    return (
        <MobileWrapper>
            <div className={clsx(viewportWidth['>=large'] && 'h-full', 'border-weak border-dashed rounded m-10')}>
                <input multiple type="file" ref={fileInput} className="hidden" onChange={fileChange} />
                <input type="file" ref={folderInput} className="hidden" onChange={folderChange} />

                <div
                    className={clsx(
                        viewportWidth['>=large'] && 'h-full',
                        'flex flex-nowrap flex-column items-center justify-center gap-8 p-8 m-auto'
                    )}
                >
                    <VintageClock coarseValue={minutes} coarseUnit="mins" fineValue={seconds} fineUnit="secs" />
                    <h2 className="text-bold">
                        {c('Title').t`Ready, set, upload.`}
                        <br />
                        {c('Title').jt`Your ${freeUploadLength} has started.`}
                    </h2>
                    <ul className="unstyled text-lg m-0">
                        <ListItemGreenTick>{c('Onboarding Info').t`Upload files, folders, photos`}</ListItemGreenTick>
                        <ListItemGreenTick>{c('Onboarding Info')
                            .t`Your storage limit won’t be affected`}</ListItemGreenTick>
                        <ListItemGreenTick>{c('Onboarding Info')
                            .t`Encryption happens automatically`}</ListItemGreenTick>
                    </ul>
                    <div className="flex gap-3 w-full justify-center">
                        <ButtonWithTextAndIcon
                            color="norm"
                            size="large"
                            buttonText="Upload file"
                            iconName="file-arrow-in-up"
                            onClick={fileClick}
                        />
                        <ButtonWithTextAndIcon
                            color="weak"
                            size="large"
                            buttonText="Upload folder"
                            iconName="folder-arrow-up"
                            onClick={folderClick}
                        />
                    </div>
                    <span className="flex justify-center gap-2">
                        <Icon name="lock-filled" className="color-success" /> {c('Info').t`End-to-end encrypted`}
                    </span>
                </div>
            </div>
        </MobileWrapper>
    );
}

function FreeUploadLength() {
    return (
        <span className="color-primary">{
            // translator: length of free upload period after starting the application
            c('Onboarding Info').t`10 minutes`
        }</span>
    );
}

function MobileWrapper({ children }: { children: React.ReactNode }) {
    const { viewportWidth } = useActiveBreakpoint();

    if (viewportWidth['>=large']) {
        return <>{children}</>;
    }
    return <div className="overflow-auto">{children}</div>;
}
