import { MimeIcon } from '@proton/components';

import { DecryptedLink, usePublicFolderView } from '../../store';
import SharedPageLayout from './SharedPageLayout';
import SharedPageHeader from './SharedPageHeader';
import ReportAbuseButton from './ReportAbuseButton';

interface Props {
    token: string;
    rootLink: DecryptedLink;
}

export default function SharedFolder({ token, rootLink }: Props) {
    const folderView = usePublicFolderView(token, rootLink.linkId);
    return (
        <SharedPageLayout reportAbuseButton={<ReportAbuseButton linkInfo={rootLink} />}>
            <SharedPageHeader onDownload={() => alert('TODO')}>
                <MimeIcon name="folder" size={28} />
                &nbsp;{rootLink.name}
            </SharedPageHeader>
            {folderView.items.map(({ name }) => name).join(', ')}
        </SharedPageLayout>
    );
}
