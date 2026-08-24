import { c } from 'ttag';

import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import Row from '../../components/container/Row';
import Label from '../../components/label/Label';
import Info from '../../components/link/Info';
import DesktopNotificationPanel from './DesktopNotificationPanel';

export interface Props {
    onTest?: () => Promise<Notification | undefined>;
    infoURL?: string;
}

const DesktopNotificationSection = ({ onTest, infoURL = getKnowledgeBaseUrl('/desktop-notifications') }: Props) => {
    return (
        <Row>
            <Label>
                <span className="mr-2">{c('Label').t`Desktop notification`}</span>
                <Info url={infoURL} />
            </Label>
            <DesktopNotificationPanel onTest={onTest} />
        </Row>
    );
};

export default DesktopNotificationSection;
