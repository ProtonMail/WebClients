import { UserModel } from '@proton/shared/lib/interfaces';
import { c } from 'ttag';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';

import { Alert, PrimaryButton, Icon, Href } from '../../../components';
import { useAddresses, useModals } from '../../../hooks';

import { ImportModal } from '../importModal';
import { SettingsParagraph, SettingsSection } from '../../account';
import useOAuthPopup, { getOAuthAuthorizationUrl } from '../../../hooks/useOAuthPopup';
import { G_OAUTH_SCOPE_CALENDAR, OAUTH_TEST_IDS } from '../../importAssistant/constants';
import { OAuthProps, OAUTH_PROVIDER } from '../../importAssistant/interfaces';
import { ImportCalendarModal } from '../../importAssistant';

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

    const handleImport = () =>
        canImport && defaultCalendar
            ? createModal(<ImportModal defaultCalendar={defaultCalendar} calendars={activeCalendars} />)
            : undefined;

    const { triggerOAuthPopup } = useOAuthPopup({
        authorizationUrl: getOAuthAuthorizationUrl({ scope: G_OAUTH_SCOPE_CALENDAR }),
    });

    const handleOAuthClick = () => {
        triggerOAuthPopup(OAUTH_PROVIDER.GOOGLE, (oauthProps: OAuthProps) => {
            createModal(<ImportCalendarModal addresses={addresses} oauthProps={oauthProps} />);
        });
    };

    const oauthImportRenderer = () => (
        <PrimaryButton
            onClick={handleOAuthClick}
            className="inline-flex flex-justify-center flex-align-items-center"
            disabled={loadingAddresses}
        >
            <Icon name="calendar-days" className="mr0-5" />
            {c('Action').t`Continue with Google`}
        </PrimaryButton>
    );

    const classicImportRenderer = () => (
        <>
            {showAlert ? (
                <Alert type="warning">{c('Info')
                    .t`You need to have an active personal calendar to import your events.`}</Alert>
            ) : null}
            <SettingsParagraph>
                {c('Calendar import section description').t`Import events or the contents of a calendar via ICS files.`}
                <br />
                <Href url="https://protonmail.com/support/knowledge-base/import-calendar-to-protoncalendar/">{c(
                    'Knowledge base link label'
                ).t`Here's how`}</Href>
            </SettingsParagraph>
            <PrimaryButton onClick={handleImport} disabled={!canImport}>
                {c('Action').t`Import events`}
            </PrimaryButton>
        </>
    );

    return (
        <SettingsSection>
            {OAUTH_TEST_IDS.includes(user.ID) ? oauthImportRenderer() : classicImportRenderer()}
        </SettingsSection>
    );
};

export default CalendarImportSection;
