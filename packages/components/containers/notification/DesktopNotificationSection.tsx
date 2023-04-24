import { c } from 'ttag';

import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Info, Label, Row } from '../../components';
import DesktopNotificationPanel, { Props } from './DesktopNotificationPanel';

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
