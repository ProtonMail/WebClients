import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, ToolbarButton, useActiveBreakpoint } from '@proton/components';
import { PHOTOS_ACCEPTED_INPUT } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';

import { type OnFileUploadSuccessCallbackData, useFileUploadInput } from '../../../store';

interface PhotosUploadButtonProps {
    shareId: string;
    linkId: string;
    onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void;
    type?: 'toolbar' | 'norm';
}
export const PhotosUploadButton: FC<PhotosUploadButtonProps> = ({
    shareId,
    linkId,
    onFileUpload,
    type = 'toolbar',
}) => {
    const { inputRef: fileInput, handleClick, handleChange } = useFileUploadInput(shareId, linkId, true);

    const { viewportWidth } = useActiveBreakpoint();

    return (
        <>
            <input
                multiple
                type="file"
                ref={fileInput}
                className="hidden"
                onChange={(e) => {
                    handleChange(e, onFileUpload);
                }}
                accept={PHOTOS_ACCEPTED_INPUT}
            />
            {type === 'toolbar' && (
                <ToolbarButton
                    onClick={handleClick}
                    data-testid="toolbar-photos-upload"
                    title={c('Action').t`Upload photos`}
                    className="inline-flex flex-nowrap flex-row items-center"
                >
                    <Icon name="plus" className={clsx(!viewportWidth.xsmall && 'mr-2')} />{' '}
                    <span className={clsx(viewportWidth.xsmall && 'sr-only')}>{c('Action').t`Upload photos`}</span>
                </ToolbarButton>
            )}
            {type === 'norm' && (
                <Button
                    onClick={handleClick}
                    data-testid="norm-photos-upload"
                    color="norm"
                    shape="solid"
                    size="small"
                    icon={viewportWidth.xsmall}
                    title={c('Action').t`Add photos`}
                    className="inline-flex flex-row flex-nowrap items-center"
                >
                    <Icon name="plus" className={clsx(!viewportWidth.xsmall && 'mr-2')} />
                    <span className={clsx(viewportWidth.xsmall && 'sr-only')}>{c('Action').t`Add photos`}</span>
                </Button>
            )}
        </>
    );
};
