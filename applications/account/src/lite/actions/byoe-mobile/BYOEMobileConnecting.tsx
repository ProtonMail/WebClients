import { c } from 'ttag';

import mailLogo from '@proton/styles/assets/img/byoe/connecting-proton-mail-logo.svg';
import gmailLogo from '@proton/styles/assets/img/illustrations/gmail-logo.svg';

import './BYOEMobileConnecting.scss';

interface Props {
    /** The Gmail address being connected. */
    email: string | undefined;
}

/** Full screen shown while the BYOE address is being created, once the user comes back from Google. */
export const BYOEMobileConnecting = ({ email }: Props) => {
    return (
        <output className="byoe-mobile-connecting flex flex-column items-center justify-center text-center p-6">
            <div
                className="byoe-mobile-connecting-illustration flex items-center justify-center mb-6"
                aria-hidden="true"
            >
                <div className="byoe-mobile-connecting-gmail flex items-center justify-center">
                    <img src={gmailLogo} alt="" width={46} height={35} />
                </div>

                <div className="byoe-mobile-connecting-dots">
                    <span className="byoe-mobile-connecting-dot" />
                    <span className="byoe-mobile-connecting-dot" />
                    <span className="byoe-mobile-connecting-dot" />
                </div>

                <div className="byoe-mobile-connecting-mail">
                    <div className="byoe-mobile-connecting-shine">
                        <div className="byoe-mobile-connecting-ring">
                            <div className="byoe-mobile-connecting-sweep" />
                        </div>
                    </div>
                    <img src={mailLogo} alt="" />
                </div>
            </div>
            <h2 className="text-3xl text-bold m-0">{c('Title').t`Connecting...`}</h2>
            {/* Always rendered so the title doesn't jump when the email arrives */}
            <p
                className="byoe-mobile-connecting-email color-weak text-semibold m-0 mt-2"
                data-visible={!!email}
                aria-hidden={!email}
            >
                {email ?? '\u00a0'}
            </p>
        </output>
    );
};
