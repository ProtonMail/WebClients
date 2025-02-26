import type { FC } from 'react';

import { c, msgid } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

import type { PhotoLink } from '../../../store';

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
            title={c('Action').ngettext(msgid`Download photo`, `Download photos`, selectedLinks.length)}
            disabled={loading}
            onClick={onClick}
            data-testid="toolbar-download-selection"
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <Icon name="arrow-down-line" className="mr-2" />
            {c('Action').ngettext(msgid`Download photo`, `Download photos`, selectedLinks.length)}
        </ToolbarButton>
    );
};
