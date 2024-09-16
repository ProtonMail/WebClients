import { c } from 'ttag';

import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import { useLoading } from '@proton/hooks';
import { updatePMSignature } from '@proton/shared/lib/api/mailSettings';
import { APP_UPSELL_REF_PATH, MAIL_APP_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';

import { Toggle, useModalState } from '../../components';
import { useApi, useEventManager, useNotifications, useToggle, useUser } from '../../hooks';

interface Props {
    id: string;
    mailSettings?: Partial<MailSettings>;
    userSettings?: Partial<UserSettings>;
}

const PMSignature = ({ id, mailSettings = {}, userSettings = {} }: Props) => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { state, toggle } = useToggle(!!mailSettings.PMSignature);
    const [user] = useUser();

    const hasPaidMail = user.hasPaidMail;

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.MAIL_FOOTER,
        isSettings: true,
    });

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const handleChange = async (checked: number) => {
        await api(updatePMSignature(checked));
        await call();
        toggle();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <div className="flex flex-1">
            <div
                className="border-container flex-1 pr-4 py-2 mb-4"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                    __html: getProtonMailSignature({
                        isReferralProgramLinkEnabled: !!mailSettings.PMSignatureReferralLink,
                        referralProgramUserLink: userSettings.Referral?.Link,
                    }),
                }}
            />
            <div className="ml-0 md:ml-2 pt-2" data-testid="settings:identity-section:signature-toggle">
                <Toggle
                    loading={loading}
                    id={id}
                    checked={state}
                    onChange={({ target }) => {
                        if (hasPaidMail) {
                            withLoading(handleChange(+target.checked));
                        } else {
                            handleUpsellModalDisplay(true);
                        }
                    }}
                />
            </div>

            {renderUpsellModal && (
                <UpsellModal
                    title={c('Title').t`Personalise your e-mail footer`}
                    description={c('Description')
                        .t`To remove the ${MAIL_APP_NAME} footer, upgrade and unlock even more premium features.`}
                    modalProps={upsellModalProps}
                    upgradePath={addUpsellPath(getUpgradePath({ user }), upsellRef)}
                    features={[
                        'unlimited-folders-and-labels',
                        'search-message-content',
                        'more-storage',
                        'more-email-addresses',
                        'custom-email-domains',
                    ]}
                />
            )}
        </div>
    );
};

export default PMSignature;
