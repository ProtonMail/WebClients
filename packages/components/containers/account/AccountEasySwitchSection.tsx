import { c } from 'ttag';

import { ImportType, PROVIDER_INSTRUCTIONS } from '@proton/shared/lib/interfaces/EasySwitch';

import { useAddresses, useModals } from '../../hooks';
import { ProviderCard } from '../../components';

import SettingsSectionWide from './SettingsSectionWide';
import SettingsParagraph from './SettingsParagraph';

import { ImportAssistantOauthModal } from '../easySwitch';
import ImportMailModal from '../easySwitch/mail/modals/ImportMailModal';
import { ImportProvider } from '../../components/easySwitch/ProviderCard';

const { GOOGLE, OUTLOOK, YAHOO, OTHER } = ImportProvider;

const AccountEasySwitchSection = () => {
    const { createModal } = useModals();
    const [addresses, loadingAddresses] = useAddresses();

    const handleOAuthClick = () => {
        createModal(
            <ImportAssistantOauthModal
                addresses={addresses}
                defaultCheckedTypes={[ImportType.MAIL, ImportType.CALENDAR, ImportType.CONTACTS]}
            />
        );
    };

    const handleIMAPClick = (instructions?: PROVIDER_INSTRUCTIONS) =>
        createModal(<ImportMailModal addresses={addresses} providerInstructions={instructions} />);

    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`Effortlessly and securely move your emails from your current provider to Proton. If you use Google, we also support calendar, and contacts imports.`}
            </SettingsParagraph>

            <div className="mb1 text-bold">{c('Info').t`Select a service provider to get started`}</div>

            <div className="mt0-5">
                <ProviderCard
                    provider={GOOGLE}
                    onClick={handleOAuthClick}
                    disabled={loadingAddresses}
                    className="mb1 mr1"
                />

                <ProviderCard
                    provider={YAHOO}
                    onClick={() => handleIMAPClick(PROVIDER_INSTRUCTIONS.YAHOO)}
                    disabled={loadingAddresses}
                    className="mb1 mr1"
                />

                <ProviderCard
                    provider={OUTLOOK}
                    onClick={() => handleIMAPClick()}
                    disabled={loadingAddresses}
                    className="mb1 mr1"
                />

                <ProviderCard
                    provider={OTHER}
                    onClick={() => handleIMAPClick()}
                    disabled={loadingAddresses}
                    className="mb1"
                />
            </div>
        </SettingsSectionWide>
    );
};

export default AccountEasySwitchSection;
