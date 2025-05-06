import { c } from 'ttag';

import ConnectGmailButton from '@proton/activation/src/components/SettingsArea/ConnectGmailButton';
import { type APP_NAMES, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';

const getFeatureDescription = (hasAccessToBYOE: boolean) => {
    if (hasAccessToBYOE) {
        return (
            <div className="color-weak">
                <p className="my-1">{c('loc_nightly: BYOE')
                    .t`Connect your existing Gmail address so you can send and receive emails with it, just like any ${MAIL_APP_NAME} address. Setup takes only one click.`}</p>
            </div>
        );
    }
    return (
        <div className="color-weak">
            <p className="my-1">{c('Info')
                .t`Forward incoming mail from another account to your secure ${MAIL_APP_NAME} inbox.`}</p>
        </div>
    );
};

interface Props {
    app: APP_NAMES;
}

const GmailForwarding = ({ app }: Props) => {
    const hasAccessToBYOE = useFlag('InboxBringYourOwnEmail');

    return (
        <>
            <div className="rounded border max-w-custom px-6 py-5 flex flex-column flex-nowrap mb-8">
                <h2 className="h3 m-0 pt-0 mb-4 text-bold">
                    {hasAccessToBYOE
                        ? c('loc_nightly: BYOE').t`Connect your Gmail address`
                        : c('Info').t`Set up forwarding`}
                </h2>
                {getFeatureDescription(hasAccessToBYOE)}
                <ConnectGmailButton
                    app={app}
                    className="mt-2 inline-flex items-center justify-center gap-2"
                    showIcon
                    buttonText={
                        hasAccessToBYOE
                            ? c('Action').t`Connect your Gmail address`
                            : c('Action').t`Set up auto-forwarding from Gmail`
                    }
                />
            </div>
        </>
    );
};

export default GmailForwarding;
