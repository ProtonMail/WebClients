import { c } from 'ttag';

import { UserModel } from '@proton/shared/lib/interfaces';
import { EASY_SWITCH_SOURCE, ImportType } from '@proton/shared/lib/interfaces/EasySwitch';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/calendar/constants';

import { Alert, GoogleButton, Href, PrimaryButton } from '../../../components';

import { useAddresses, useFeature, useModals } from '../../../hooks';

import { ImportModal } from '../importModal';
import { SettingsParagraph, SettingsSection } from '../../account';
import { EasySwitchOauthModal } from '../../easySwitch';
import { FeatureCode } from '../../features';

interface Props {
    defaultCalendar?: Calendar;
    activeCalendars: Calendar[];
    user: UserModel;
}

const CalendarImportSection = ({ activeCalendars, defaultCalendar, user }: Props) => {
    const { hasNonDelinquentScope } = user;
    const { createModal } = useModals();
    const [addresses, loadingAddresses] = useAddresses();

    const easySwitchCalendarFeature = useFeature(FeatureCode.EasySwitchCalendar);
    const isEasySwitchCalendarEnabled = easySwitchCalendarFeature.feature?.Value;

    const showAlert = !activeCalendars.length && hasNonDelinquentScope;
    const canManualImport = !!activeCalendars.length && hasNonDelinquentScope;

    const handleManualImport = () =>
        canManualImport && defaultCalendar
            ? createModal(<ImportModal defaultCalendar={defaultCalendar} calendars={activeCalendars} />)
            : undefined;

    const handleOAuthClick = () =>
        createModal(
            <EasySwitchOauthModal
                source={EASY_SWITCH_SOURCE.IMPORT_CALENDAR_SETTINGS}
                addresses={addresses}
                defaultCheckedTypes={[ImportType.CALENDAR]}
                isEasySwitchCalendarEnabled={isEasySwitchCalendarEnabled}
            />
        );

    return (
        <SettingsSection>
            {showAlert ? (
                <Alert className="mb1" type="warning">{c('Info')
                    .t`You need to have an active personal calendar to import your events from .ics.`}</Alert>
            ) : null}

            <SettingsParagraph>
                {c('Calendar import section description')
                    .t`You can import ICS files from another calendar to ${CALENDAR_APP_NAME}. This lets you quickly import one event or your entire agenda.`}
                <br />
                <Href url="https://protonmail.com/support/knowledge-base/import-calendar-to-protoncalendar/">{c(
                    'Knowledge base link label'
                ).t`Here's how`}</Href>
            </SettingsParagraph>

            {isEasySwitchCalendarEnabled ? (
                <>
                    <GoogleButton
                        onClick={handleOAuthClick}
                        disabled={loadingAddresses || !hasNonDelinquentScope}
                        className="mr1"
                    />

                    <PrimaryButton onClick={handleManualImport} disabled={!canManualImport}>
                        {c('Action').t`Import from .ics`}
                    </PrimaryButton>
                </>
            ) : (
                <PrimaryButton onClick={handleManualImport} disabled={!canManualImport}>
                    {c('Action').t`Import from .ics`}
                </PrimaryButton>
            )}
        </SettingsSection>
    );
};

export default CalendarImportSection;
