import { IDP_TYPE } from '../interfaces';

export const getSAMLConfigs = () => ({
    url: 'core/v4/saml/configs',
    method: 'GET',
});

export const getSAMLStaticInfo = () => ({
    url: 'core/v4/saml/sp/info',
    method: 'GET',
});

export const getSAMLEdugainInfo = () => ({
    url: 'core/v4/saml/edugain/info',
    method: 'GET',
});

export const setupSAMLUrl = (data: { DomainID: string; MetadataURL: string }) => ({
    url: 'core/v4/saml/setup/url',
    method: 'POST',
    data,
});

export const setupSAMLXml = (data: { DomainID: string; XML: string }) => ({
    url: 'core/v4/saml/setup/xml',
    method: 'POST',
    data,
});

export const setupSAMLFields = (data: {
    DomainID: string;
    SSOURL: string;
    SSOEntityID: string;
    Certificate: string;
}) => ({
    url: 'core/v4/saml/setup/fields',
    method: 'POST',
    data: {
        ...data,
        Type: IDP_TYPE.DEFAULT,
    },
});

export const setupEdugainSAML = (data: { DomainID: string; SSOEntityID: string; EdugainAffiliations: string[] }) => ({
    url: 'core/v4/saml/setup/fields',
    method: 'POST',
    data: {
        ...data,
        Type: IDP_TYPE.EDUGAIN,

        /**
         * Dummy values. BE requires something to be set for these values. In the case of edugain, they are ignored.
         * These should be removed when the BE no longer requires SSOURL and Certificate
         */
        SSOURL: 'https://dummy.proton.me',
        Certificate: 'dummy',
        // Dummy value end
    },
});

export const updateSAMLConfig = (
    uid: string,
    data: {
        DomainID: string;
        SSOURL: string;
        SSOEntityID: string;
        Certificate: string;
    }
) => ({
    url: `core/v4/saml/configs/${uid}/fields`,
    method: 'PUT',
    data,
});

export const removeSAMLConfig = (uid: string) => ({
    url: `core/v4/saml/configs/${uid}/delete`,
    method: 'PUT',
});

export const getSCIMInfo = () => ({
    url: 'core/v4/organizations/scim',
    method: 'GET',
});

export const setupSCIM = (data: { Password: string }) => ({
    url: 'core/v4/organizations/scim',
    method: 'POST',
    data,
});

export const updateSCIM = (data: { State: 1; Password: string } | { State: 0 }) => ({
    url: 'core/v4/organizations/scim',
    method: 'PUT',
    data,
});
