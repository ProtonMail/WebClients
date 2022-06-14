import { useState } from 'react';

import { MimeIcon } from '@proton/components';

import { DecryptedLink, usePublicFolderView } from '../../store';
import { FileBrowserStateProvider } from '../FileBrowser/state';
import SharedPageLayout from './SharedPageLayout';
import SharedPageHeader from './SharedPageHeader';
import SharedPageBreadcrumb from './SharedPageBreadcrumb';
import SharedFileBrowser from './SharedFileBrowser';
import ReportAbuseButton from './ReportAbuseButton';

interface Props {
    token: string;
    rootLink: DecryptedLink;
}

export default function SharedFolder({ token, rootLink }: Props) {
    const [linkId, setLinkId] = useState(rootLink.linkId);

    const folderView = usePublicFolderView(token, linkId);

    const onItemOpen = (item: DecryptedLink) => {
        if (item.isFile) {
            return;
        }
        setLinkId(item.linkId);
    };

    return (
        <FileBrowserStateProvider itemIds={folderView.items.map(({ linkId }) => linkId)}>
            <SharedPageLayout withSidebar reportAbuseButton={<ReportAbuseButton linkInfo={rootLink} />}>
                <SharedPageHeader token={token} rootItem={rootLink} items={folderView.items}>
                    <MimeIcon className="flex-item-noshrink" name="folder" size={28} />
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
