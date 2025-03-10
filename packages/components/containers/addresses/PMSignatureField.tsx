import { useMemo } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import NewUpsellModal from '@proton/components/components/upsell/modal/NewUpsellModal';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import { useMailUpsellConfig } from '@proton/components/components/upsell/useMailUpsellConfig';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/mailSettings';
import { useDispatch } from '@proton/redux-shared-store';
import { updatePMSignature } from '@proton/shared/lib/api/mailSettings';
import { APP_UPSELL_REF_PATH, MAIL_APP_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';
import signatureImg from '@proton/styles/assets/img/illustrations/new-upsells-img/tools.svg';

interface Props {
    id: string;
    mailSettings?: Partial<MailSettings>;
    userSettings?: Partial<UserSettings>;
}

const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: MAIL_UPSELL_PATHS.MAIL_FOOTER,
    isSettings: true,
});

const PMSignature = ({ id, mailSettings = {}, userSettings = {} }: Props) => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();
    const { state, toggle } = useToggle(hasBit(mailSettings.PMSignature, PM_SIGNATURE.ENABLED));
    const [user] = useUser();
    const pmSignatureLocked = useMemo(
        () => hasBit(mailSettings.PMSignature, PM_SIGNATURE.LOCKED),
        [mailSettings.PMSignature]
    );
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const handleChange = async (checked: number) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updatePMSignature(checked));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        toggle();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const { upsellConfig, displayNewUpsellModalsVariant } = useMailUpsellConfig({ upsellRef });

    const modal = displayNewUpsellModalsVariant ? (
        <NewUpsellModal
            titleModal={c('Title').t`Personalize your email footer`}
            description={c('Description').t`Make your email footer your own — showcase your unique brand, not ours.`}
            modalProps={upsellModalProps}
            illustration={signatureImg}
            sourceEvent="BUTTON_MAIL_FOOTER"
            {...upsellConfig}
        />
    ) : (
        <UpsellModal
            title={c('Title').t`Personalize your e-mail footer`}
            description={c('Description')
                .t`To remove the ${MAIL_APP_NAME} footer, upgrade and unlock even more premium features.`}
            modalProps={upsellModalProps}
            sourceEvent="BUTTON_MAIL_FOOTER"
            features={[
                'unlimited-folders-and-labels',
                'search-message-content',
                'more-storage',
                'more-email-addresses',
                'custom-email-domains',
            ]}
            {...upsellConfig}
        />
    );

    return (
        <div className="flex flex-1 align-items-center">
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
                    title={
                        pmSignatureLocked
                            ? c('Tooltip: PM signature locked').t`This signature cannot be modified`
                            : undefined
                    }
                    disabled={pmSignatureLocked}
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
            {renderUpsellModal && modal}
        </div>
    );
};

export default PMSignature;
