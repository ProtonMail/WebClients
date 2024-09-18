import { c } from 'ttag';

import { Logo, useUser } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import envelope from '@proton/styles/assets/img/illustrations/envelope.svg';
import gmailLogo from '@proton/styles/assets/img/illustrations/gmail-logo.svg';
import key from '@proton/styles/assets/img/illustrations/key.svg';
import stopSign from '@proton/styles/assets/img/illustrations/stop-hand-sign.svg';
import clsx from '@proton/utils/clsx';

import './GmailSyncModalAnimation.scss';

interface Props {
    reduceHeight?: boolean;
}

const GmailSyncModalAnimation = ({ reduceHeight = false }: Props) => {
    const [user] = useUser();
    const { DisplayName, Name } = user;
    const nameToDisplay = <strong key="dummyKey">{DisplayName || Name}</strong>;

    const mobile = isMobile();

    return (
        <div className={clsx('gsma', reduceHeight && 'gsma--reduced-height')} aria-hidden="true">
            <div className="gsma-gmail-username-inbox">
                <div className="gsma-gmail-logo">
                    <img src={gmailLogo} alt="" width={mobile ? 29 : 40} height={mobile ? 21 : 30} />
                </div>
                <div className="gsma-username">
                    {/* translator: keep this translation as small as possible since the space is reduced.  */}
                    <span className="gsma-username-content">{c('Animation').jt`${nameToDisplay}'s inbox`}</span>
                </div>
            </div>
            <div className="gsma-auto-forward">
                <div className="gsma-forwarded">
                    {c('Animation').t`Auto forwarded`}
                    <Icon className="ml-4 shrink-0" name="arrow-up-and-right-big" />
                </div>
                <div className="gsma-envelope">
                    <img src={envelope} alt="" width={mobile ? 55 : 45} height={mobile ? 29 : 35} />
                </div>
                <div className="gsma-new-email">{c('Animation').t`New email`}</div>
            </div>
            <div className="gsma-proton">
                <Logo appName="proton-mail" variant="glyph-only" size={mobile ? 8 : 12} className="gsma-proton-logo" />
            </div>
            <div className="gsma-received">
                <div className="gsma-received-inner ui-prominent">
                    <div className="gsma-received-inner-content">{c('Animation').t`Email received`}</div>
                </div>
            </div>
            <div className="gsma-trackers">
                <div className="gsma-trackers-inner ui-prominent">
                    <div className="gsma-trackers-inner-content">
                        <img src={stopSign} alt="" width={35} height={35} />
                        {c('Animation').t`5 trackers removed`}
                    </div>
                </div>
            </div>
            <div className="gsma-encrypted">
                <div className="gsma-encrypted-inner ui-prominent">
                    <div className="gsma-encrypted-inner-content">
                        <img src={key} alt="" width={35} height={35} />
                        {c('Animation').t`Encrypted`}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GmailSyncModalAnimation;
