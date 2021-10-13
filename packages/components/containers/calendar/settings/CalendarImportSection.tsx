import { c } from 'ttag';

import { UserModel } from '@proton/shared/lib/interfaces';
import { ImportType } from '@proton/shared/lib/interfaces/EasySwitch';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/calendar/constants';

import { Alert, Button, GoogleButton } from '../../../components';

import { useAddresses, useFeature, useModals } from '../../../hooks';

import { ImportModal } from '../importModal';
import { SettingsParagraph, SettingsSection } from '../../account';
import { ImportAssistantOauthModal } from '../../easySwitch';
import { FeatureCode } from '../../features';

interface Props {
    defaultCalendar?: Calendar;
    activeCalendars: Calendar[];
    user: UserModel;
}

const CalendarImportSection = ({ activeCalendars, defaultCalendar, user }: Props) => {
    const canImport = !!activeCalendars.length && user.hasNonDelinquentScope;
    const showAlert = !activeCalendars.length && user.hasNonDelinquentScope;
    const { createModal } = useModals();
    const [addresses, loadingAddresses] = useAddresses();

    const isEasySwitchEnabled = useFeature(FeatureCode.EasySwitch).feature?.Value;

    const handleImport = () =>
        canImport && defaultCalendar
            ? createModal(<ImportModal defaultCalendar={defaultCalendar} calendars={activeCalendars} />)
            : undefined;

    const handleOAuthClick = () => {
        createModal(<ImportAssistantOauthModal addresses={addresses} defaultCheckedTypes={[ImportType.CALENDAR]} />);
    };

    return (
        <SettingsSection>
            {showAlert ? (
                <Alert className="mb1" type="warning">{c('Info')
                    .t`You need to have an active personal calendar to import your events.`}</Alert>
            ) : null}

            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/import-calendar-to-protoncalendar/">
                {c('Info')
                    .t`You can import ICS files from another calendar to ${CALENDAR_APP_NAME}. This lets you quickly import one event or your entire agenda.`}
            </SettingsParagraph>

            {isEasySwitchEnabled && (
                <GoogleButton onClick={handleOAuthClick} disabled={loadingAddresses} className="mr1" />
            )}

            <Button onClick={handleImport} disabled={!canImport}>
                {c('Action').t`Import from .ics`}
            </Button>
        </SettingsSection>
    );
};

export default CalendarImportSection;
