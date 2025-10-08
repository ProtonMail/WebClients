import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Href } from '@proton/atoms/Href/Href';
import Icon from '@proton/components/components/icon/Icon';
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
                    <Banner className="mb-3" variant="norm" icon={<Icon name="exclamation-circle" />}>
                        {c('fido2: Error')
                            .t`Something went wrong authenticating with your security key. Please try again.`}
                    </Banner>
                </div>
            )}
        </>
    );
};
export default AuthSecurityKeyContent;
