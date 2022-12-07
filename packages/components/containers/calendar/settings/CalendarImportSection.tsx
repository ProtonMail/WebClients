import { c } from 'ttag';

import { EasySwitchOauthImportButton, EasySwitchProvider } from '@proton/activation';
import { EASY_SWITCH_SOURCE, ImportType } from '@proton/activation/interface';
import { getProbablyActiveCalendars, getWritableCalendars } from '@proton/shared/lib/calendar/calendar';
import { IMPORT_CALENDAR_FAQ_URL } from '@proton/shared/lib/calendar/constants';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { UserModel } from '@proton/shared/lib/interfaces';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { Alert, Href, PrimaryButton, useModalState } from '../../../components';
import { SettingsParagraph, SettingsSection } from '../../account';
import { ImportModal } from '../importModal';

interface Props {
    calendars: VisualCalendar[];
    defaultCalendar?: VisualCalendar;
    user: UserModel;
}

const CalendarImportSection = ({ calendars, defaultCalendar, user }: Props) => {
    const { hasNonDelinquentScope } = user;

    const activeWritableCalendars = getWritableCalendars(getProbablyActiveCalendars(calendars));
    const hasActiveCalendars = !!activeWritableCalendars.length;

    const [importModal, setIsImportModalOpen, renderImportModal] = useModalState();

    const handleManualImport = () => setIsImportModalOpen(true);

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

            <EasySwitchProvider>
                <EasySwitchOauthImportButton
                    className="mr1"
                    source={EASY_SWITCH_SOURCE.IMPORT_CALENDAR_SETTINGS}
                    defaultCheckedTypes={[ImportType.CALENDAR]}
                    displayOn={'GoogleCalendar'}
                />
            </EasySwitchProvider>

            <PrimaryButton onClick={handleManualImport} disabled={!hasNonDelinquentScope || !hasActiveCalendars}>
                {c('Action').t`Import from ICS`}
            </PrimaryButton>
        </SettingsSection>
    );
};

export default CalendarImportSection;
