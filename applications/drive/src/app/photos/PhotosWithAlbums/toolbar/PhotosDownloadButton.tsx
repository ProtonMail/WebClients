import type { FC } from 'react';

import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { PhotoLink } from '../../../store';

interface Props {
    selectedLinks: PhotoLink[];
    requestDownload: (linkIds: { linkId: string; shareId: string }[]) => Promise<void>;
    showIconOnly: boolean;
}

export const PhotosDownloadButton: FC<Props> = ({ requestDownload, selectedLinks, showIconOnly }) => {
    const [loading, withLoading] = useLoading();

    const onClick = () => {
        const linkIds = selectedLinks.map((link) => ({ linkId: link.linkId, shareId: link.rootShareId }));

        withLoading(requestDownload(linkIds)).catch(noop);
    };

    return (
        <ToolbarButton
            title={c('Action').t`Download`}
            disabled={loading}
            onClick={onClick}
            data-testid="toolbar-download-selection"
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <Icon name="arrow-down-line" className={clsx(!showIconOnly && 'mr-2')} />
            <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Download`}</span>
        </ToolbarButton>
    );
};
