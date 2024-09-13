import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import ReadonlyFieldWithCopy from './ReadonlyFieldWithCopy';

export interface IdentityProviderEndpointsContentProps {
    issuerID: string;
    callbackURL: string;
}

const IdentityProviderEndpointsContent = ({ issuerID, callbackURL }: IdentityProviderEndpointsContentProps) => {
    // Using a function here so that we can extend to other applications without requiring retranslation of this string
    const getDescriptionString = (appName: typeof VPN_APP_NAME) => {
        // translator: variable here is an application name. Example full sentence "When enabling SAML for Proton VPN in your identity provider, you might be prompted to use the callback (ACS) URL and issuer ID. Just copy-paste the data below into your identity provider fields."
        return c('Info')
            .t`When enabling SAML for ${appName} in your identity provider, you might be prompted to use the callback (ACS) URL and issuer ID. Just copy-paste the data below into your identity provider fields.`;
    };

    return (
        <div className="flex flex-column gap-4">
            <div>
                {getDescriptionString(VPN_APP_NAME)}
                <br />
                <Href href="https://protonvpn.com/support/sso">{c('Info').t`Learn more`}</Href>
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
                assistiveText={c('Info').t`Copy and paste this URL into the entity ID field of your identity provider`}
            />
        </div>
    );
};

export default IdentityProviderEndpointsContent;
