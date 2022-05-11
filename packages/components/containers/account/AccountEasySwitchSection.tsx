import { c } from 'ttag';

import {
    DEFAULT_CALENDAR_USER_SETTINGS,
    getDefaultCalendar,
    getIsPersonalCalendar,
    getProbablyActiveCalendars,
    getVisualCalendars,
} from '@proton/shared/lib/calendar/calendar';
import {
    EASY_SWITCH_SOURCE,
    EasySwitchFeatureFlag,
    ImportType,
    NON_OAUTH_PROVIDER,
} from '@proton/shared/lib/interfaces/EasySwitch';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';
import partition from '@proton/utils/partition';

import { ProviderCard, useModalState } from '../../components';
import { ImportProvider } from '../../components/easySwitch/ProviderCard';
import { useModalTwo } from '../../components/modalTwo/useModalTwo';
import { useAddresses, useCalendarUserSettings, useCalendars, useFeature, useModals, useUser } from '../../hooks';
import { ImportModal as ImportCalendarModal } from '../calendar/importModal';
import ContactImportModal from '../contacts/import/ContactImportModal';
import { EasySwitchDefaultModal, EasySwitchOauthModal } from '../easySwitch';
import { FeatureCode } from '../features';
import SettingsParagraph from './SettingsParagraph';
import SettingsSectionWide from './SettingsSectionWide';

const { GOOGLE, OUTLOOK, YAHOO, OTHER } = ImportProvider;

const AccountEasySwitchSection = () => {
    const { createModal } = useModals();
    const [user, loadingUser] = useUser();
    const [addresses, loadingAddresses] = useAddresses();

    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const easySwitchFeatureValue = easySwitchFeature.feature?.Value;
    const easySwitchFeatureLoading = easySwitchFeature.loading;

    const isLoading = loadingUser || loadingAddresses || easySwitchFeatureLoading;

    const handleOAuthClick = () => {
        if (easySwitchFeatureLoading) {
            return;
        }

        createModal(
            <EasySwitchOauthModal
                source={EASY_SWITCH_SOURCE.EASY_SWITCH_SETTINGS}
                addresses={addresses}
                defaultCheckedTypes={[
                    easySwitchFeatureValue?.GoogleMail && ImportType.MAIL,
                    easySwitchFeatureValue?.GoogleCalendar && ImportType.CALENDAR,
                    easySwitchFeatureValue?.GoogleContacts && ImportType.CONTACTS,
                ].filter(isTruthy)}
                featureMap={easySwitchFeatureValue}
            />
        );
    };

    const [calendars, loadingCalendars] = useCalendars();
    const [calendarUserSettings = DEFAULT_CALENDAR_USER_SETTINGS, loadingCalendarUserSettings] =
        useCalendarUserSettings();

    const activeCalendars = getProbablyActiveCalendars(getVisualCalendars(calendars || []));

    const [personalActiveCalendars] = partition<VisualCalendar>(activeCalendars, getIsPersonalCalendar);

    const defaultCalendar = getDefaultCalendar(personalActiveCalendars, calendarUserSettings.DefaultCalendarID);

    const [importCalendarModal, setIsImportCalendarModalOpen, renderImportCalendarModal] = useModalState();

    const onOpenCalendarModal = () => {
        if (defaultCalendar) {
            setIsImportCalendarModalOpen(true);
        }
    };

    const [importContactModal, onImportContact] = useModalTwo<void, void>(ContactImportModal, false);

    const canImportCalendars = !!personalActiveCalendars.length;

    const handleIMAPClick = (provider?: NON_OAUTH_PROVIDER) =>
        createModal(
            <EasySwitchDefaultModal
                isLoading={loadingCalendars || loadingCalendarUserSettings}
                canImportCalendars={canImportCalendars}
                onOpenCalendarModal={onOpenCalendarModal}
                onImportContact={onImportContact}
                addresses={addresses}
                provider={provider}
                featureMap={easySwitchFeatureValue}
            />
        );

    const disabled = isLoading || !user.hasNonDelinquentScope;

    return (
        <SettingsSectionWide>
            {renderImportCalendarModal && (
                <ImportCalendarModal
                    {...importCalendarModal}
                    isOpen={importCalendarModal.open}
                    defaultCalendar={defaultCalendar!}
                    calendars={personalActiveCalendars}
                />
            )}

            {importContactModal}

            <SettingsParagraph>
                {c('Info')
                    .t`Import your emails, calendars, and contacts from another service to Proton. We'll guide you each step of the way and encrypt your data as it gets moved. Welcome to the world of privacy.`}
            </SettingsParagraph>

            <div className="mb1 text-bold">{c('Info').t`Select a service provider to start`}</div>

            <div className="mt0-5">
                <ProviderCard provider={GOOGLE} onClick={handleOAuthClick} disabled={disabled} className="mb1 mr1" />

                <ProviderCard
                    provider={YAHOO}
                    onClick={() => handleIMAPClick(NON_OAUTH_PROVIDER.YAHOO)}
                    disabled={disabled}
                    className="mb1 mr1"
                />

                <ProviderCard
                    provider={OUTLOOK}
                    onClick={() => handleIMAPClick(NON_OAUTH_PROVIDER.OUTLOOK)}
                    disabled={disabled}
                    className="mb1 mr1"
                />

                <ProviderCard provider={OTHER} onClick={() => handleIMAPClick()} disabled={disabled} className="mb1" />
            </div>
        </SettingsSectionWide>
    );
};

export default AccountEasySwitchSection;
