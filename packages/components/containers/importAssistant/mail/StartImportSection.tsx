import { c } from 'ttag';

import { useAddresses, useModals } from '../../../hooks';
import { PrimaryButton } from '../../../components';

import { SettingsSection, SettingsParagraph } from '../../account';

import ImportMailModal from './modals/ImportMailModal';

const StartImportSection = () => {
    const { createModal } = useModals();
    const [addresses, loadingAddresses] = useAddresses();

    const handleClick = () => createModal(<ImportMailModal addresses={addresses} />);

    return (
        <SettingsSection>
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/import-assistant/">
                {c('Info')
                    .t`Transfer your data safely to Proton. Import Assistant connects to your external email provider and imports your selected messages and folders.`}
            </SettingsParagraph>

            <div>
                <PrimaryButton
                    className="inline-flex flex-justify-center flex-align-items-center mt0-5"
                    onClick={handleClick}
                    disabled={loadingAddresses}
                >
                    {c('Action').t`Start import`}
                </PrimaryButton>
            </div>
        </SettingsSection>
    );
};

export default StartImportSection;
