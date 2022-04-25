import { c } from 'ttag';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { ButtonLike, SettingsLink } from '../../components';

import { SettingsSection, SettingsParagraph } from '../account';
import PmMeButton from './PmMeButton';

interface Props {
    isPMAddressActive: boolean;
}

const PmMeSection = ({ isPMAddressActive }: Props) => {
    return (
        <SettingsSection>
            {!isPMAddressActive ? (
                <>
                    <SettingsParagraph className="mb1" learnMoreUrl={getKnowledgeBaseUrl('/pm-me-addresses/')}>
                        {c('Info')
                            .t`Add a @pm.me email address to your account. This simple, shorter domain stands for "${MAIL_APP_NAME} me" or "Private Message me."`}
                    </SettingsParagraph>
                    <PmMeButton />
                </>
            ) : (
                <>
                    <SettingsParagraph className="mb1">
                        {c('Info')
                            .t`You can now receive messages to your @pm.me address. Upgrade to a paid plan to also send emails using your @pm.me address and create additional @pm.me addresses.`}
                    </SettingsParagraph>

                    <ButtonLike color="norm" as={SettingsLink} path="/upgrade">
                        {c('Action').t`Upgrade`}
                    </ButtonLike>
                </>
            )}
        </SettingsSection>
    );
};

export default PmMeSection;
