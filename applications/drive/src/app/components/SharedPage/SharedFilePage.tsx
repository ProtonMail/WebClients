import { c } from 'ttag';

import { DecryptedLink, useDownload } from '../../store';
import SharedPageLayout from './SharedPageLayout';
import SharedPageHeader from './SharedPageHeader';
import SharedFileBrowser from './SharedFileBrowser';
import ReportAbuseButton from './ReportAbuseButton';

interface Props {
    token: string;
    link: DecryptedLink;
}

export default function SharedFile({ token, link }: Props) {
    const { download } = useDownload();

    const onDownload = () => {
        download([
            {
                ...link,
                shareId: token,
            },
        ]);
    };

    return (
        <SharedPageLayout withSidebar reportAbuseButton={<ReportAbuseButton linkInfo={link} />}>
            <SharedPageHeader onDownload={onDownload}>{c('Title').t`Download shared file`}</SharedPageHeader>
            <SharedFileBrowser items={[link]} />
        </SharedPageLayout>
    );
}
