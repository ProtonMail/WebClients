import { useState } from 'react';
import { c } from 'ttag';

import { UserModel } from '@proton/shared/lib/interfaces';
import { EASY_SWITCH_SOURCE, EasySwitchFeatureFlag, ImportType } from '@proton/shared/lib/interfaces/EasySwitch';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/calendar/constants';

import { Alert, GoogleButton, Href, Loader, PrimaryButton } from '../../../components';

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

    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const easySwitchFeatureLoading = easySwitchFeature.loading;
    const easySwitchFeatureValue = easySwitchFeature.feature?.Value;

    const showAlert = !activeCalendars.length && hasNonDelinquentScope;
    const canManualImport = !!activeCalendars.length && hasNonDelinquentScope;

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const handleManualImport = () => {
        if (canManualImport && defaultCalendar) {
            setIsImportModalOpen(true);
        }
    };

    const handleOAuthClick = () =>
        createModal(
            <EasySwitchOauthModal
                source={EASY_SWITCH_SOURCE.IMPORT_CALENDAR_SETTINGS}
                addresses={addresses}
                defaultCheckedTypes={[ImportType.CALENDAR]}
                featureMap={easySwitchFeatureValue}
            />
        );

    const isLoading = easySwitchFeatureLoading || loadingAddresses;

    return isLoading ? (
        <Loader />
    ) : (
        <SettingsSection>
            {isImportModalOpen && (
                <ImportModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    defaultCalendar={defaultCalendar!}
                    calendars={activeCalendars}
                />
            )}

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

            {!easySwitchFeatureLoading && easySwitchFeatureValue?.GoogleCalendar && (
                <GoogleButton
                    onClick={handleOAuthClick}
                    disabled={isLoading || !hasNonDelinquentScope}
                    className="mr1"
                />
            )}

            <PrimaryButton onClick={handleManualImport} disabled={!canManualImport}>
                {c('Action').t`Import from .ics`}
            </PrimaryButton>
        </SettingsSection>
    );
};

export default CalendarImportSection;
