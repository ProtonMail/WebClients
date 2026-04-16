import { useLumoUserType } from "../../providers/LumoPlanProvider";
import NotificationPanel from "./NotificationPanel";
import type { NotificationProps } from "./NotificationPanel";

const SURVEY_URL_PAID = 'https://participant.use2.usertesting.com/se/invite/468d6172-eede-4e81-8a31-5306ee8ea0e5';
const SURVEY_URL_FREE = 'https://participant.use2.usertesting.com/se/invite/578d45a9-b44e-4de1-bd63-ade10afc40f7';
const SURVEY_URL_GUEST = 'https://participant.use2.usertesting.com/se/invite/6d6d99d5-b598-4c56-9700-f10a43372579';

type SurveyPanelProps = Omit<NotificationProps, 'actionUrl'>;

export default function SurveyPanel(props: SurveyPanelProps) {
    const { isGuest, isLumoPaid } = useLumoUserType();
    const actionUrl = isGuest ? SURVEY_URL_GUEST : isLumoPaid ? SURVEY_URL_PAID : SURVEY_URL_FREE;

    return <NotificationPanel {...props} actionUrl={actionUrl} />;
}
