import { ChangeEvent } from 'react';

import { c } from 'ttag';

import { updatePMSignature } from '@proton/shared/lib/api/mailSettings';
import { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { getProtonMailSignature } from '@proton/shared/lib/mail/signature';

import { Toggle } from '../../components';
import { useApiWithoutResult, useEventManager, useNotifications, useToggle } from '../../hooks';

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

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await request(+target.checked);
        await call();
        toggle();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <div className="flex flex-item-fluid">
            <div
                className="border-container flex-item-fluid pr1 pt0-5 pb0-5 mb-4"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                    __html: getProtonMailSignature({
                        isReferralProgramLinkEnabled: !!mailSettings.PMSignatureReferralLink,
                        referralProgramUserLink: userSettings.Referral?.Link,
                    }),
                }}
            />
            <div className="ml-0 md:ml-2 pt0-5" data-testid="settings:identity-section:signature-toggle">
                <Toggle loading={loading} id={id} checked={state} onChange={handleChange} />
            </div>
        </div>
    );
};

export default PMSignature;
