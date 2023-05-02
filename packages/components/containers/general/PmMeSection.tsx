import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { APP_UPSELL_REF_PATH, MAIL_APP_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { SettingsLink } from '../../components';
import { SettingsParagraph, SettingsSection } from '../account';
import PmMeButton from './PmMeButton';

interface Props {
    isPMAddressActive: boolean;
}

const PmMeSection = ({ isPMAddressActive }: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: MAIL_UPSELL_PATHS.PM_ME,
        isSettings: true,
    });

    return (
        <SettingsSection>
            {!isPMAddressActive ? (
                <>
                    <SettingsParagraph className="mb1" learnMoreUrl={getKnowledgeBaseUrl('/pm-me-addresses')}>
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

                    <ButtonLike color="norm" as={SettingsLink} path={addUpsellPath('/upgrade', upsellRef)}>
                        {c('Action').t`Upgrade`}
                    </ButtonLike>
                </>
            )}
        </SettingsSection>
    );
};

export default PmMeSection;
