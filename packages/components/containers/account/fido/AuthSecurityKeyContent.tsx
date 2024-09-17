import { c } from 'ttag';

import { Href } from '@proton/atoms';
import Banner, { BannerBackgroundColor } from '@proton/components/components/banner/Banner';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import physicalKey from '@proton/styles/assets/img/illustrations/physical-key.svg';

const AuthSecurityKeyContent = ({ error }: { error?: boolean }) => {
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
            {error && (
                <div className="mt-4">
                    <Banner icon="exclamation-circle" backgroundColor={BannerBackgroundColor.WEAK}>
                        {c('fido2: Error')
                            .t`Something went wrong authenticating with your security key. Please try again.`}
                    </Banner>
                </div>
            )}
        </>
    );
};
export default AuthSecurityKeyContent;
