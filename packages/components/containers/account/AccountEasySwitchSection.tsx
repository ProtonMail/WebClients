import { c } from 'ttag';

import { EASY_SWITCH_SOURCE, ImportType, PROVIDER_INSTRUCTIONS } from '@proton/shared/lib/interfaces/EasySwitch';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import { useAddresses, useFeature, useModals, useUser } from '../../hooks';
import { ProviderCard } from '../../components';

import SettingsSectionWide from './SettingsSectionWide';
import SettingsParagraph from './SettingsParagraph';

import { ImportAssistantOauthModal } from '../easySwitch';
import ImportMailModal from '../easySwitch/mail/modals/ImportMailModal';
import { ImportProvider } from '../../components/easySwitch/ProviderCard';
import { FeatureCode } from '../features';

const { GOOGLE, OUTLOOK, YAHOO, OTHER } = ImportProvider;

const AccountEasySwitchSection = () => {
    const { createModal } = useModals();
    const [user, loadingUser] = useUser();
    const [addresses, loadingAddresses] = useAddresses();

    const easySwitchCalendarFeature = useFeature(FeatureCode.EasySwitchCalendar);
    const isEasySwitchCalendarEnabled = easySwitchCalendarFeature.feature?.Value;

    const isLoading = loadingUser || loadingAddresses || easySwitchCalendarFeature.loading;

    const handleOAuthClick = () => {
        createModal(
            <ImportAssistantOauthModal
                source={EASY_SWITCH_SOURCE.EASY_SWITCH_SETTINGS}
                addresses={addresses}
                defaultCheckedTypes={[
                    ImportType.MAIL,
                    isEasySwitchCalendarEnabled && ImportType.CALENDAR,
                    ImportType.CONTACTS,
                ].filter(isTruthy)}
                isEasySwitchCalendarEnabled={isEasySwitchCalendarEnabled}
            />
        );
    };

    const handleIMAPClick = (instructions?: PROVIDER_INSTRUCTIONS) =>
        createModal(<ImportMailModal addresses={addresses} providerInstructions={instructions} />);

    const disabled = isLoading || !user.hasNonDelinquentScope;

    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`Effortlessly and securely move your emails from your current provider to Proton. If you use Google, we also support calendar and contacts imports.`}
            </SettingsParagraph>

            <div className="mb1 text-bold">{c('Info').t`Select a service provider to get started`}</div>

            <div className="mt0-5">
                <ProviderCard provider={GOOGLE} onClick={handleOAuthClick} disabled={disabled} className="mb1 mr1" />

                <ProviderCard
                    provider={YAHOO}
                    onClick={() => handleIMAPClick(PROVIDER_INSTRUCTIONS.YAHOO)}
                    disabled={disabled}
                    className="mb1 mr1"
                />

                <ProviderCard
                    provider={OUTLOOK}
                    onClick={() => handleIMAPClick()}
                    disabled={disabled}
                    className="mb1 mr1"
                />

                <ProviderCard provider={OTHER} onClick={() => handleIMAPClick()} disabled={disabled} className="mb1" />
            </div>
        </SettingsSectionWide>
    );
};

export default AccountEasySwitchSection;
