import { MimeIcon } from '@proton/components';

import { DecryptedLink, useDownload, usePublicFolderView } from '../../store';
import SharedPageLayout from './SharedPageLayout';
import SharedPageHeader from './SharedPageHeader';
import SharedFileBrowser from './SharedFileBrowser';
import ReportAbuseButton from './ReportAbuseButton';

interface Props {
    token: string;
    rootLink: DecryptedLink;
}

export default function SharedFolder({ token, rootLink }: Props) {
    const folderView = usePublicFolderView(token, rootLink.linkId);
    const { download } = useDownload();

    const onDownload = () => {
        download([
            {
                ...rootLink,
                shareId: token,
            },
        ]);
    };

    return (
        <SharedPageLayout withSidebar reportAbuseButton={<ReportAbuseButton linkInfo={rootLink} />}>
            <SharedPageHeader onDownload={onDownload}>
                <MimeIcon name="folder" size={28} />
                &nbsp;{rootLink.name}
            </SharedPageHeader>
            <SharedFileBrowser items={folderView.items} />
        </SharedPageLayout>
    );
}
