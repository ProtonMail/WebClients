import type { FC } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { Icon, ToolbarButton } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

import type { PhotoLink } from '../../../../store';

interface Props {
    selectedLinks: PhotoLink[];
    requestDownload: (linkIds: string[]) => Promise<void>;
}

export const PhotosDownloadButton: FC<Props> = ({ requestDownload, selectedLinks }) => {
    const [loading, withLoading] = useLoading();

    const onClick = () => {
        const linkIds = selectedLinks.map((link) => link.linkId);

        withLoading(requestDownload(linkIds)).catch(noop);
    };

    return (
        <ToolbarButton
            title={c('Action').t`Download`}
            disabled={loading}
            icon={loading ? <CircleLoader /> : <Icon name="arrow-down-line" alt={c('Action').t`Download`} />}
            onClick={onClick}
            data-testid="toolbar-download"
        />
    );
};
