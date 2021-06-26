import { UserModel } from '@proton/shared/lib/interfaces';
import React from 'react';
import { c } from 'ttag';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

import { Alert, PrimaryButton, Icon } from '../../../components';
import { useAddresses, useModals } from '../../../hooks';

import { ImportModal } from '../importModal';
import { SettingsParagraph, SettingsSection } from '../../account';
import useOAuthPopup, { getOAuthAuthorizationUrl } from '../../../hooks/useOAuthPopup';
import { G_OAUTH_SCOPE_CALENDAR, OAUTH_TEST_IDS } from '../../importAssistant/constants';
import { OAuthProps, OAUTH_PROVIDER } from '../../importAssistant/interfaces';
import { ImportCalendarModal } from '../../importAssistant';

const CALENDAR_APP_NAME = getAppName(APPS.PROTONCALENDAR);

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
            <Icon name="calendar" className="mr0-5" />
            {c('Action').t`Continue with Google`}
        </PrimaryButton>
    );

    const classicImportRenderer = () => (
        <>
            {showAlert ? (
                <Alert type="warning">{c('Info').t`You need to have an active calendar to import your events.`}</Alert>
            ) : null}
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/import-calendar-to-protoncalendar/">
                {c('Info')
                    .t`You can import ICS files from another calendar to ${CALENDAR_APP_NAME}. This lets you quickly import one event or your entire agenda.`}
            </SettingsParagraph>
            <PrimaryButton onClick={handleImport} disabled={!canImport}>
                {c('Action').t`Import calendar`}
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
