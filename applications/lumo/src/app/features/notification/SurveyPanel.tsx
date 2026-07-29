import { useLumoUserType } from '../../providers/LumoPlanProvider';
import NotificationPanel from './NotificationPanel';
import type { NotificationProps } from './NotificationPanel';

const SURVEY_URL_PAID = 'https://participant.use2.usertesting.com/se/invite/c84ea47c-10b8-42d2-917e-8b5963d72489';
const SURVEY_URL_FREE = 'https://participant.use2.usertesting.com/se/invite/0f5c951c-95b3-4854-b34b-24f71828d0e3';
const SURVEY_URL_GUEST = 'https://participant.use2.usertesting.com/se/invite/19d2d6cf-1ba2-47ea-9400-016d33e3c096';

type SurveyPanelProps = Omit<NotificationProps, 'actionUrl'>;

export default function SurveyPanel(props: SurveyPanelProps) {
    const { isGuest, isLumoPaid } = useLumoUserType();
    const actionUrl = isGuest ? SURVEY_URL_GUEST : isLumoPaid ? SURVEY_URL_PAID : SURVEY_URL_FREE;

    return <NotificationPanel {...props} actionUrl={actionUrl} />;
}
