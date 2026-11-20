import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Href } from '@proton/atoms/Href/Href';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import physicalKey from '@proton/styles/assets/img/illustrations/physical-key.svg';

import AwaitingTouchBanner from './AwaitingTouchBanner';

const AuthSecurityKeyContent = ({ awaitingTouch, error }: { awaitingTouch: boolean; error?: string | null }) => {
    return (
        <>
            <div className="flex justify-center mt-4 mb-6">
                <img src={physicalKey} alt={c('fido2: Info').t`Security key`} />
            </div>
            <div>
                {c('fido2: Info').t`Insert a security key linked to your ${BRAND_NAME} Account.`}
                <br />
                <Href href={getKnowledgeBaseUrl('/two-factor-authentication-2fa')}>{c('Info').t`Learn more`}</Href>
            </div>
            {awaitingTouch && <AwaitingTouchBanner />}
            {error && (
                <div className="mt-4">
                    <Banner className="mb-3" variant="norm" icon={<IcExclamationCircle />}>
                        {(() => {
                            if (error === 'NotSupportedError') {
                                return c('fido2: Error')
                                    .t`This browser doesn't support security keys. Please try a different browser.`;
                            }
                            // Chrome on Android, when the device's credential manager fails; retrying alone rarely helps
                            if (error === 'NotReadableError') {
                                return c('fido2: Error')
                                    .t`Your device couldn't complete the security key request. Try again, or use another sign-in method.`;
                            }
                            // Browsers report a cancel and a timeout with the same name
                            if (error === 'NotAllowedError') {
                                return c('fido2: Error')
                                    .t`The security key request was cancelled or timed out. Please try again.`;
                            }
                            return c('fido2: Error')
                                .t`Something went wrong authenticating with your security key. Please try again.`;
                        })()}
                    </Banner>
                </div>
            )}
        </>
    );
};
export default AuthSecurityKeyContent;
