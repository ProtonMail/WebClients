import { c } from 'ttag';

import { useUserSettings } from '@proton/account';
import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import UpsellModal from '@proton/components/components/upsell/UpsellModal/UpsellModal';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { updatePMSignature } from '@proton/shared/lib/api/mailSettings';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';
import signatureImg from '@proton/styles/assets/img/illustrations/new-upsells-img/tools.svg';

import { canUpdateSignature } from './helper';

interface Props {
    id: string;
}

const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: MAIL_UPSELL_PATHS.MAIL_FOOTER,
    isSettings: true,
});

const PMSignature = ({ id }: Props) => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const dispatch = useDispatch();

    const [user, loadingUser] = useUser();
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [organization, loadingOrganization] = useOrganization();
    const loadingData = loadingMailSettings || loadingUserSettings || loadingUser || loadingOrganization;

    const [loading, withLoading] = useLoading();
    const { state, toggle } = useToggle(!!mailSettings.PMSignature);
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const pmSignatureEnabled = canUpdateSignature(user, organization, mailSettings);

    const handleChange = async (checked: number) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updatePMSignature(checked));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        toggle();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    if (loadingData) {
        return null;
    }

    return (
        <div className="flex flex-1 align-items-center">
            <div
                className="border-container flex-1 pr-4 py-2 mb-4"
                dangerouslySetInnerHTML={{
                    __html: getProtonMailSignature(
                        !!mailSettings.PMSignatureReferralLink,
                        userSettings.Referral?.Link,
                        mailSettings.PMSignatureContent
                    ),
                }}
            />
            <div className="ml-0 md:ml-2 pt-2" data-testid="settings:identity-section:signature-toggle">
                <Toggle
                    loading={loading}
                    title={
                        pmSignatureEnabled
                            ? undefined
                            : c('Tooltip: PM signature locked').t`This signature cannot be modified`
                    }
                    disabled={!pmSignatureEnabled}
                    id={id}
                    checked={state}
                    onChange={({ target }) => {
                        if (user.hasPaidMail) {
                            void withLoading(handleChange(+target.checked));
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
