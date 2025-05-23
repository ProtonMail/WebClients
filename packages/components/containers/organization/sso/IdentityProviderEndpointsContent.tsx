import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import ReadonlyFieldWithCopy from './ReadonlyFieldWithCopy';
import type { SsoAppInfo } from './ssoAppInfo';

export interface IdentityProviderEndpointsContentProps {
    ssoAppInfo: SsoAppInfo;
    issuerID: string;
    callbackURL: string;
}

// Using a function here so that we can extend to other applications without requiring retranslation of this string
const getDescriptionString = (appName: string) => {
    // translator: variable here is an application name. Example full sentence "When enabling SAML for Proton VPN in your identity provider, you might be prompted to use the callback (ACS) URL and issuer ID. Just copy-paste the data below into your identity provider fields."
    return c('Info')
        .t`When enabling SAML for ${appName} in your identity provider, you might be prompted to use the callback (ACS) URL and issuer ID. Just copy-paste the data below into your identity provider fields.`;
};

const IdentityProviderEndpointsContent = ({
    ssoAppInfo,
    issuerID,
    callbackURL,
}: IdentityProviderEndpointsContentProps) => {
    return (
        <div className="flex flex-column gap-4">
            <div>
                {getDescriptionString(BRAND_NAME)}
                <br />
                <Href href={ssoAppInfo.kbUrl}>{c('Info').t`Learn more`}</Href>
            </div>
            <ReadonlyFieldWithCopy
                label={c('Label').t`Assertion Consumer Service URL`}
                value={callbackURL}
                assistiveText={c('Info')
                    .t`Copy and paste this URL into the ACS (Assertion Consumer Service) URL field of your identity provider`}
            />
            <ReadonlyFieldWithCopy
                label={c('Label').t`Issuer ID`}
                value={issuerID}
                assistiveText={c('Info').t`Copy and paste this URL into the Entity ID field of your identity provider`}
            />
        </div>
    );
};

export default IdentityProviderEndpointsContent;
