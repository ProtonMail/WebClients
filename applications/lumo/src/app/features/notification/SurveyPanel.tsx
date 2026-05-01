import NotificationPanel from "./NotificationPanel";
import type { NotificationProps } from "./NotificationPanel";

const SURVEY_URL = 'https://participant.use2.usertesting.com/se/invite/554e0a93-cec4-4fab-8662-0199602d318b';

type SurveyPanelProps = Omit<NotificationProps, 'actionUrl'>;

export default function SurveyPanel(props: SurveyPanelProps) {
    return <NotificationPanel {...props} actionUrl={SURVEY_URL} />;
}
