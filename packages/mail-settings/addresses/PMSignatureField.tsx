import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import UpsellModal from '@proton/components/components/upsell/UpsellModal/UpsellModal';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/ref';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';
import signatureImg from '@proton/styles/assets/img/illustrations/new-upsells-img/tools.svg';

interface Props {
    id: string;
    enabled: boolean;
    locked: boolean;
}

const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: MAIL_UPSELL_PATHS.MAIL_FOOTER,
    isSettings: true,
});

const PMSignature = ({ id, enabled, locked }: Props) => {
    const { update, isLoading } = useUpdateMailSetting();

    const [user, loadingUser] = useUser();
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [userSettings, loadingUserSettings] = useUserSettings();

    const state = !!mailSettings.PMSignature;
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    if (loadingMailSettings || loadingUserSettings || loadingUser) {
        return null;
    }

    // Users with no paid mail plan should be able to disable the feature as it shows an upsell
    const toggleLocked = user.hasPaidMail && locked;

    const handleChange = (checked: number) => {
        update('PMSignature', checked);
    };

    return (
        <div className="flex flex-nowrap items-center gap-4">
            <div
                className="flex-1"
                dangerouslySetInnerHTML={{
                    __html: getProtonMailSignature(
                        !!mailSettings.PMSignatureReferralLink,
                        userSettings.Referral?.Link,
                        mailSettings.PMSignatureContent
                    ),
                }}
            />
            <div className="shrink-0 flex" data-testid="settings:identity-section:signature-toggle">
                <Toggle
                    loading={isLoading('PMSignature')}
                    title={enabled ? undefined : c('Tooltip: PM signature locked').t`This signature cannot be modified`}
                    disabled={toggleLocked}
                    id={id}
                    checked={state}
                    onChange={({ target }) => {
                        if (user.hasPaidMail) {
                            handleChange(+target.checked);
                        } else {
                            handleUpsellModalDisplay(true);
                        }
                    }}
                />
            </div>

            {renderUpsellModal && (
                <UpsellModal
                    title={c('Title').t`Personalize your email footer`}
                    description={c('Description')
                        .t`Make your email footer your own — showcase your unique brand, not ours.`}
                    modalProps={upsellModalProps}
                    illustration={signatureImg}
                    upsellRef={upsellRef}
                />
            )}
        </div>
    );
};

export default PMSignature;
