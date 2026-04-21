import type { FC } from 'react';

import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { PhotoItem } from '../../usePhotos.store';

interface Props {
    selectedPhotos: PhotoItem[];
    requestDownload: (photosUids: string[]) => Promise<void>;
    showIconOnly: boolean;
}

export const PhotosDownloadButton: FC<Props> = ({ requestDownload, selectedPhotos, showIconOnly }) => {
    const [loading, withLoading] = useLoading();

    const onClick = () => {
        withLoading(requestDownload(selectedPhotos.map((photo) => photo.nodeUid))).catch(noop);
    };

    return (
        <ToolbarButton
            title={c('Action').t`Download`}
            disabled={loading}
            onClick={onClick}
            data-testid="toolbar-download-selection"
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <IcArrowDownLine className={clsx(!showIconOnly && 'mr-2')} />
            <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Download`}</span>
        </ToolbarButton>
    );
};
