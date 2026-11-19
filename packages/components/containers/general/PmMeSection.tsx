import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Href } from '@proton/atoms/Href/Href';
import { useSubscriptionForApp } from '@proton/payments-hooks/ui/hooks/useSubscriptionForApp';
import { getUpgradePath } from '@proton/payments/core/subscription/upsell';
import { APP_UPSELL_REF_PATH, MAIL_APP_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/ref';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import useSettingsLink from '../../components/link/useSettingsLink';
import useModalState from '../../components/modalTwo/useModalState';
import MailUpsellButton from '../../components/upsell/MailUpsellButton';
import PmMeUpsellModal from '../../components/upsell/modals/PmMeUpsellModal';
import { SettingsCardSection } from '../account/SettingsCardSection';
import PmMeButton, { getActivateString } from './PmMeButton';

interface Props {
    isPMAddressActive: boolean;
}

const PmMeSection = ({ isPMAddressActive }: Props) => {
    const goToSettings = useSettingsLink();
    const [user] = useUser();
    const [subscription] = useSubscriptionForApp();

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const handleUpgrade = () => {
        const upsellRef = getUpsellRef({
            app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
            component: UPSELL_COMPONENT.BANNER,
            feature: MAIL_UPSELL_PATHS.PM_ME,
            isSettings: true,
        });

        goToSettings(getUpgradePath({ user, subscription }, upsellRef), undefined, false);
    };

    const display: 'can-enable' | 'has-enabled' | 'free-needs-upgrade' | 'free-can-only-receive' = (() => {
        if (user.hasPaidMail) {
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

    const learnMoreLink = <Href href={getKnowledgeBaseUrl('/pm-me-addresses')}>{c('Link').t`Learn more`}</Href>;

    const { description, action } = (() => {
        if (display === 'can-enable') {
            return {
                description: (
                    <>
                        {c('Info')
                            .t`Add a @pm.me email address to your account. This simple, shorter domain stands for "${MAIL_APP_NAME} me" or "Private Message me."`}{' '}
                        {learnMoreLink}
                    </>
                ),
                action: <PmMeButton>{getActivateString(user)}</PmMeButton>,
            };
        }
        if (display === 'free-needs-upgrade') {
            return {
                description: (
                    <>
                        {c('Info')
                            .t`Upgrade to add a shorter @pm.me address to your account that is easier to share. It stands for “${MAIL_APP_NAME} me” or “Private Message me”.`}{' '}
                        {learnMoreLink}
                    </>
                ),
                action: (
                    <MailUpsellButton onClick={() => handleUpsellModalDisplay(true)} text={getActivateString(user)} />
                ),
            };
        }
        return {
            description: c('Info')
                .t`With your current plan, you can only receive messages with your @pm.me address. Upgrade to send messages and create additional addresses using @pm.me.`,
            action: <MailUpsellButton onClick={handleUpgrade} text={c('Action').t`Send messages with @pm.me`} />,
        };
    })();

    return (
        <>
            <SettingsCardSection
                title={c('Title').t`Short domain (@pm.me)`}
                description={description}
                actions={action}
            />

            {renderUpsellModal && (
                <PmMeUpsellModal
                    modalProps={upsellModalProps}
                    upsellRefOptions={{
                        app: 'upsell_mail-',
                        component: 'modal-',
                        isSettings: true,
                    }}
                />
            )}
        </>
    );
};

export default PmMeSection;
