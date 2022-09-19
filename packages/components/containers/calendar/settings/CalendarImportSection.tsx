import { c } from 'ttag';

import { getProbablyActiveCalendars, getWritableCalendars } from '@proton/shared/lib/calendar/calendar';
import { CALENDAR_APP_NAME, IMPORT_CALENDAR_FAQ_URL } from '@proton/shared/lib/calendar/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { EASY_SWITCH_SOURCE, EasySwitchFeatureFlag, ImportType } from '@proton/shared/lib/interfaces/EasySwitch';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { Alert, GoogleButton, Href, PrimaryButton, useModalState } from '../../../components';
import { useFeature, useModals } from '../../../hooks';
import { SettingsParagraph, SettingsSection } from '../../account';
import { EasySwitchOauthModal } from '../../easySwitch';
import { FeatureCode } from '../../features';
import { ImportModal } from '../importModal';

interface Props {
    addresses: Address[];
    calendars: VisualCalendar[];
    defaultCalendar?: VisualCalendar;
    user: UserModel;
}

const CalendarImportSection = ({ addresses, calendars, defaultCalendar, user }: Props) => {
    const { hasNonDelinquentScope } = user;
    const { createModal } = useModals();

    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const easySwitchFeatureLoading = easySwitchFeature.loading;
    const easySwitchFeatureValue = easySwitchFeature.feature?.Value;

    const activeWritableCalendars = getWritableCalendars(getProbablyActiveCalendars(calendars));
    const hasActiveCalendars = !!activeWritableCalendars.length;

    const [importModal, setIsImportModalOpen, renderImportModal] = useModalState();

    const handleManualImport = () => setIsImportModalOpen(true);

    const handleOAuthClick = () =>
        createModal(
            <EasySwitchOauthModal
                source={EASY_SWITCH_SOURCE.IMPORT_CALENDAR_SETTINGS}
                addresses={addresses}
                defaultCheckedTypes={[ImportType.CALENDAR]}
                featureMap={easySwitchFeatureValue}
            />
        );

    return (
        <SettingsSection>
            {renderImportModal && defaultCalendar && (
                <ImportModal
                    isOpen={importModal.open}
                    defaultCalendar={defaultCalendar}
                    calendars={calendars}
                    {...importModal}
                />
            )}

            {hasNonDelinquentScope && !hasActiveCalendars ? (
                <Alert className="mb1" type="warning">
                    {c('Info').t`You need to have an active personal calendar to import your events from ICS.`}
                </Alert>
            ) : null}

            <SettingsParagraph>
                {c('Calendar import section description')
                    .t`You can import ICS files from another calendar to ${CALENDAR_APP_NAME}. This lets you quickly import one event or your entire agenda.`}
                <br />
                <Href url={getKnowledgeBaseUrl(IMPORT_CALENDAR_FAQ_URL)}>{c('Knowledge base link label')
                    .t`Here's how`}</Href>
            </SettingsParagraph>

            {!easySwitchFeatureLoading && easySwitchFeatureValue?.GoogleCalendar && (
                <GoogleButton
                    onClick={handleOAuthClick}
                    disabled={easySwitchFeatureLoading || !hasNonDelinquentScope}
                    className="mr1"
                />
            )}

            <PrimaryButton onClick={handleManualImport} disabled={!hasNonDelinquentScope || !hasActiveCalendars}>
                {c('Action').t`Import from ICS`}
            </PrimaryButton>
        </SettingsSection>
    );
};

export default CalendarImportSection;
