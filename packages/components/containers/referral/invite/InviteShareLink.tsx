import { c } from 'ttag';
import { TwitterButton, Button, InputTwo, Icon } from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { useUserSettings } from '@proton/components/hooks';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

const InviteShareLink = () => {
    const appName = getAppName(APPS.PROTONMAIL);
    const [userSettings, loadingUserSettings] = useUserSettings();

    const referrerLink = userSettings.Referral?.Link || '';

    if (loadingUserSettings) {
        return null;
    }

    return (
        <div>
            <h3 className="text-bold">{c('Label').t`Your referral link`}</h3>
            <div className="invite-section-share-link flex flex-gap-1">
                <div className="flex-item-fluid">
                    <InputTwo value={referrerLink} readOnly className="color-weak" />
                </div>
                <div className="flex flex-gap-1 flex-nowrap flex-justify-end">
                    <Button
                        color="norm"
                        onClick={() => {
                            textToClipboard(referrerLink);
                        }}
                    >
                        <Icon name="link" /> {c('Button').t`Copy`}
                    </Button>
                    <TwitterButton
                        url={encodeURI(
                            'https://twitter.com/intent/tweet?text=' +
                                c('Info')
                                    .t`I’ve been using ${appName} and thought you might like it. It’s a secure email service that protects your privacy. Sign up with this link to get 1 month free: ${referrerLink}`
                        )}
                        target="_blank"
                    >
                        <Icon name="brand-twitter-filled" /> {c('Button').t`Tweet`}
                    </TwitterButton>
                </div>
            </div>
        </div>
    );
};

export default InviteShareLink;
