import { c } from 'ttag';

import { EasySwitchOauthImportButton, EasySwitchProvider } from '@proton/activation';
import { EASY_SWITCH_SOURCE, ImportProvider, ImportType } from '@proton/activation/src/interface';
import { Href } from '@proton/atoms';
import { getProbablyActiveCalendars, getWritableCalendars } from '@proton/shared/lib/calendar/calendar';
import { IMPORT_CALENDAR_FAQ_URL } from '@proton/shared/lib/calendar/constants';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { UserModel } from '@proton/shared/lib/interfaces';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { Alert, PrimaryButton, useModalState } from '../../../components';
import { SettingsParagraph, SettingsSection } from '../../account';
import { useFlag } from '../../unleash';
import { ImportModal } from '../importModal';

interface Props {
    calendars: VisualCalendar[];
    initialCalendar?: VisualCalendar;
    user: UserModel;
}

const CalendarImportSection = ({ calendars, initialCalendar, user }: Props) => {
    const { hasNonDelinquentScope } = user;
    const isImporterInMaintenance = useFlag('MaintenanceImporter');

    const activeWritableCalendars = getWritableCalendars(getProbablyActiveCalendars(calendars));
    const hasActiveCalendars = !!activeWritableCalendars.length;

    const [importModal, setIsImportModalOpen, renderImportModal] = useModalState();

    const handleManualImport = () => setIsImportModalOpen(true);

    return (
        <SettingsSection>
            {renderImportModal && initialCalendar && (
                <ImportModal
                    isOpen={importModal.open}
                    initialCalendar={initialCalendar}
                    calendars={calendars}
                    {...importModal}
                />
            )}

            {hasNonDelinquentScope && !hasActiveCalendars ? (
                <Alert className="mb-4" type="warning">
                    {c('Info').t`You need to have an active personal calendar to import your events from ICS.`}
                </Alert>
            ) : null}

            <SettingsParagraph>
                {c('Calendar import section description')
                    .t`You can import ICS files from another calendar to ${CALENDAR_APP_NAME}. This lets you quickly import one event or your entire agenda.`}
                <br />
                <Href href={getKnowledgeBaseUrl(IMPORT_CALENDAR_FAQ_URL)}>{c('Knowledge base link label')
                    .t`Here's how`}</Href>
            </SettingsParagraph>

            {!isImporterInMaintenance && (
                <EasySwitchProvider>
                    <EasySwitchOauthImportButton
                        className="mr-4"
                        source={EASY_SWITCH_SOURCE.IMPORT_CALENDAR_SETTINGS}
                        defaultCheckedTypes={[ImportType.CALENDAR]}
                        displayOn={'GoogleCalendar'}
                        provider={ImportProvider.GOOGLE}
                    />
                </EasySwitchProvider>
            )}

            <PrimaryButton onClick={handleManualImport} disabled={!hasNonDelinquentScope || !hasActiveCalendars}>
                {c('Action').t`Import from ICS`}
            </PrimaryButton>
        </SettingsSection>
    );
};

export default CalendarImportSection;
