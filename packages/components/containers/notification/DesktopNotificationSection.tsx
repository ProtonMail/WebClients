import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Label } from '../../components';
import Row from '../../components/container/Row';
import type { Props } from './DesktopNotificationPanel';
import DesktopNotificationPanel from './DesktopNotificationPanel';

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
