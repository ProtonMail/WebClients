import { useEffect, useState } from 'react';

import { MimeIcon } from '@proton/components';

import { DecryptedLink, usePublicFolderView } from '../../store';
import { FileBrowserStateProvider } from '../FileBrowser';
import ReportAbuseButton from './ReportAbuseButton';
import SharedFileBrowser from './SharedFileBrowser';
import SharedPageBreadcrumb from './SharedPageBreadcrumb';
import SharedPageHeader from './SharedPageHeader';
import SharedPageLayout from './SharedPageLayout';

const MIN_ITEMS_TO_EXPAND_HEIGHT = 15;

interface Props {
    token: string;
    rootLink: DecryptedLink;
}

export default function SharedFolder({ token, rootLink }: Props) {
    const [linkId, setLinkId] = useState(rootLink.linkId);

    const folderView = usePublicFolderView(token, linkId);

    // To not make it bigger and smaller all the time based on which
    // folder is currently active - once there is too many items,
    // keep it expanded so its nicer for user to navigate around.
    const [expand, setExpand] = useState(false);
    useEffect(() => {
        if (!expand && folderView.items.length >= MIN_ITEMS_TO_EXPAND_HEIGHT) {
            setExpand(true);
        }
    }, [folderView.items.length]);

    const onItemOpen = (item: DecryptedLink) => {
        if (item.isFile) {
            return;
        }
        setLinkId(item.linkId);
    };

    return (
        <FileBrowserStateProvider itemIds={folderView.items.map(({ linkId }) => linkId)}>
            <SharedPageLayout withSidebar expand={expand} reportAbuseButton={<ReportAbuseButton linkInfo={rootLink} />}>
                <SharedPageHeader token={token} rootItem={rootLink} items={folderView.items}>
                    <MimeIcon className="flex-item-noshrink" name="folder" size={24} />
                    &nbsp;
                    <SharedPageBreadcrumb
                        token={token}
                        name={folderView.folderName}
                        linkId={linkId}
                        setLinkId={setLinkId}
                    />
                </SharedPageHeader>
                <SharedFileBrowser {...folderView} onItemOpen={onItemOpen} />
            </SharedPageLayout>
        </FileBrowserStateProvider>
    );
}
