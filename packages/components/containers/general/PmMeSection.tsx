import { c } from 'ttag';

import { APP_UPSELL_REF_PATH, MAIL_APP_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { MailUpsellButton, PmMeUpsellModal, useModalState, useSettingsLink } from '../../components';
import { useUser } from '../../hooks';
import { SettingsParagraph, SettingsSection } from '../account';
import PmMeButton from './PmMeButton';

interface Props {
    isPMAddressActive: boolean;
}

const PmMeSection = ({ isPMAddressActive }: Props) => {
    const goToSettings = useSettingsLink();
    const [{ hasPaidMail, Name }] = useUser();

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const handleUpgrade = () => {
        const upsellRef = getUpsellRef({
            app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
            component: UPSELL_COMPONENT.BANNER,
            feature: MAIL_UPSELL_PATHS.PM_ME,
            isSettings: true,
        });

        goToSettings(`/upgrade?ref=${upsellRef}`, undefined, false);
    };

    const display: 'can-enable' | 'has-enabled' | 'free-needs-upgrade' | 'free-can-only-receive' = (() => {
        if (hasPaidMail) {
            if (!isPMAddressActive) {
                return 'can-enable';
            } else {
                return 'has-enabled';
            }
        } else {
            if (!isPMAddressActive) {
                return 'free-needs-upgrade';
            } else {
                return 'free-can-only-receive';
            }
        }
    })();

    if (display === 'has-enabled') {
        return null;
    }

    return (
        <SettingsSection>
            {display === 'can-enable' && (
                <>
                    <SettingsParagraph className="mb-4" learnMoreUrl={getKnowledgeBaseUrl('/pm-me-addresses')}>
                        {c('Info')
                            .t`Add a @pm.me email address to your account. This simple, shorter domain stands for "${MAIL_APP_NAME} me" or "Private Message me."`}
                    </SettingsParagraph>
                    <PmMeButton />
                </>
            )}
            {display === 'free-needs-upgrade' && (
                <>
                    <SettingsParagraph className="mb-4" learnMoreUrl={getKnowledgeBaseUrl('/pm-me-addresses')}>
                        {c('Info')
                            .t`Upgrade to add a shorter @pm.me address to your account that is easier to share. It stands for “${MAIL_APP_NAME} me” or “Private Message me”.`}
                    </SettingsParagraph>

                    <MailUpsellButton
                        onClick={() => handleUpsellModalDisplay(true)}
                        text={c('Action').t`Activate ${Name}@pm.me`}
                    />
                </>
            )}
            {display === 'free-can-only-receive' && (
                <>
                    <SettingsParagraph className="mb-4">
                        {c('Info')
                            .t`With your current plan, you can only receive messages with your @pm.me address. Upgrade to send messages and create additional addresses using @pm.me.`}
                    </SettingsParagraph>

                    <MailUpsellButton onClick={handleUpgrade} text={c('Action').t`Send messages with @pm.me`} />
                </>
            )}

            {renderUpsellModal && <PmMeUpsellModal modalProps={upsellModalProps} />}
        </SettingsSection>
    );
};

export default PmMeSection;
