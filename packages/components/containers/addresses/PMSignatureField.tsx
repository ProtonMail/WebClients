import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { NewUpsellModal } from '@proton/components';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useToggle from '@proton/components/hooks/useToggle';
import { useLoading } from '@proton/hooks';
import { updatePMSignature } from '@proton/shared/lib/api/mailSettings';
import { APP_UPSELL_REF_PATH, MAIL_APP_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import {
    addUpsellPath,
    getUpgradePath,
    getUpsellRef,
    useNewUpsellModalVariant,
} from '@proton/shared/lib/helpers/upsell';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';
import signatureImg from '@proton/styles/assets/img/illustrations/new-upsells-img/tools.svg';

import { useNotifications } from '../../hooks';

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

    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();

    const modal = displayNewUpsellModalsVariant ? (
        <NewUpsellModal
            titleModal={c('Title').t`Personalize your email footer`}
            description={c('Description').t`Make your email footer your own — showcase your unique brand, not ours.`}
            modalProps={upsellModalProps}
            upgradePath={addUpsellPath(getUpgradePath({ user }), upsellRef)}
            illustration={signatureImg}
            sourceEvent="BUTTON_MAIL_FOOTER"
        />
    ) : (
        <UpsellModal
            title={c('Title').t`Personalise your e-mail footer`}
            description={c('Description')
                .t`To remove the ${MAIL_APP_NAME} footer, upgrade and unlock even more premium features.`}
            modalProps={upsellModalProps}
            upgradePath={addUpsellPath(getUpgradePath({ user }), upsellRef)}
            sourceEvent="BUTTON_MAIL_FOOTER"
            features={[
                'unlimited-folders-and-labels',
                'search-message-content',
                'more-storage',
                'more-email-addresses',
                'custom-email-domains',
            ]}
        />
    );

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

            {renderUpsellModal && modal}
        </div>
    );
};

export default PMSignature;
