import { c } from 'ttag';

import {
    EASY_SWITCH_SOURCE,
    EasySwitchFeatureFlag,
    ImportType,
    NON_OAUTH_PROVIDER,
} from '@proton/shared/lib/interfaces/EasySwitch';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import { useAddresses, useFeature, useModals, useUser } from '../../hooks';
import { ProviderCard } from '../../components';

import SettingsSectionWide from './SettingsSectionWide';
import SettingsParagraph from './SettingsParagraph';

import { EasySwitchOauthModal, EasySwitchDefaultModal } from '../easySwitch';
import { ImportProvider } from '../../components/easySwitch/ProviderCard';
import { FeatureCode } from '../features';

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

    const handleIMAPClick = (provider?: NON_OAUTH_PROVIDER) =>
        createModal(
            <EasySwitchDefaultModal addresses={addresses} provider={provider} featureMap={easySwitchFeatureValue} />
        );

    const disabled = isLoading || !user.hasNonDelinquentScope;

    return (
        <SettingsSectionWide>
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
