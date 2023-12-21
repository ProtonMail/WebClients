import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import ReadonlyFieldWithCopy from './ReadonlyFieldWithCopy';

interface Props {
    issuerID: string;
    callbackURL: string;
}

const IdentityProviderEndpointsContent = ({ issuerID, callbackURL }: Props) => {
    return (
        <div className="flex flex-column gap-4">
            <div>
                {c('Info')
                    .t`When enabling SAML for ${VPN_APP_NAME} in your identity provider, you might be prompted to use the callback (ACS) URL and issuer ID. Just copy-paste the data below into your identity provider fields.`}
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
