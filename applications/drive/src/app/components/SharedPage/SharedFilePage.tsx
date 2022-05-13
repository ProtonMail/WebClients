import { c } from 'ttag';

import { DecryptedLink } from '../../store';
import SharedPageLayout from './SharedPageLayout';
import SharedPageHeader from './SharedPageHeader';
import ReportAbuseButton from './ReportAbuseButton';

interface Props {
    link: DecryptedLink;
}

// eslint-disable-next-line
export default function SharedFile({ link }: Props) {
    return (
        <SharedPageLayout reportAbuseButton={<ReportAbuseButton linkInfo={link} />}>
            <SharedPageHeader onDownload={() => alert('TODO')}>{c('Title').t`Download shared file`}</SharedPageHeader>
            {link.name} / {link.size}
        </SharedPageLayout>
    );
}
