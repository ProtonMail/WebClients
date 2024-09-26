import { c } from 'ttag';

import Row from '@proton/components/components/container/Row';
import Label from '@proton/components/components/label/Label';
import Info from '@proton/components/components/link/Info';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

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
