import React, { ChangeEvent } from 'react';

import { c } from 'ttag';

import { updatePMSignature } from '@proton/shared/lib/api/mailSettings';
import { APP_UPSELL_REF_PATH, MAIL_APP_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';

import { Toggle, UpsellModal, useModalState } from '../../components';
import { useApiWithoutResult, useEventManager, useNotifications, useToggle, useUser } from '../../hooks';

interface Props {
    id: string;
    mailSettings?: Partial<MailSettings>;
    userSettings?: Partial<UserSettings>;
}

const PMSignature = ({ id, mailSettings = {}, userSettings = {} }: Props) => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(updatePMSignature);
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

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        if (hasPaidMail) {
            await request(+target.checked);
            await call();
            toggle();
            createNotification({ text: c('Success').t`Preference saved` });
        } else {
            handleUpsellModalDisplay(true);
        }
    };

    return (
        <div className="flex flex-item-fluid">
            <div
                className="border-container flex-item-fluid pr-4 py-2 mb-4"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                    __html: getProtonMailSignature({
                        isReferralProgramLinkEnabled: !!mailSettings.PMSignatureReferralLink,
                        referralProgramUserLink: userSettings.Referral?.Link,
                    }),
                }}
            />
            <div className="ml-0 md:ml-2 pt-2" data-testid="settings:identity-section:signature-toggle">
                <Toggle loading={loading} id={id} checked={state} onChange={handleChange} />
            </div>

            {renderUpsellModal && (
                <UpsellModal
                    title={c('Title').t`Personalise your e-mail footer`}
                    description={c('Description')
                        .t`To remove the ${MAIL_APP_NAME} footer, upgrade and unlock even more premium features.`}
                    modalProps={upsellModalProps}
                    upsellRef={upsellRef}
                    features={[
                        'unlimited-folders-and-labels',
                        'search-message-content',
                        'more-storage',
                        'more-email-addresses',
                        'custom-email-domains',
                        'email-aliases',
                    ]}
                />
            )}
        </div>
    );
};

export default PMSignature;
