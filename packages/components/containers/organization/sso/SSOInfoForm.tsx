import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useGetSamlSSO } from '@proton/account/samlSSO/hooks';
import { Button } from '@proton/atoms';
import Info from '@proton/components/components/link/Info';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import metrics, { observeApiError } from '@proton/metrics';
import { CacheType } from '@proton/redux-utilities';
import { updateSAMLConfig } from '@proton/shared/lib/api/samlSSO';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Domain, EdugainAffiliations, SSO } from '@proton/shared/lib/interfaces';
import { IDP_TYPE } from '@proton/shared/lib/interfaces';

import type { IdentityProviderEndpointsContentProps } from './IdentityProviderEndpointsContent';
import ReadonlyFieldWithCopy from './ReadonlyFieldWithCopy';
import { EdugainAffiliationLabels } from './constants';

interface SSOInfo {
    url: string;
    entity: string;
    certificate: string;
    type: IDP_TYPE;
    edugainAffiliations: EdugainAffiliations[];
}

interface Props extends IdentityProviderEndpointsContentProps {
    domain: Domain;
    sso: SSO;
    onImportSaml: () => void;
    onTestSaml: () => void;
}

const SSOInfoForm = ({ domain, sso, issuerID, callbackURL, onImportSaml, onTestSaml }: Props) => {
    const { onFormSubmit, validator } = useFormErrors();
    const getSamlSSO = useGetSamlSSO();
    const { createNotification } = useNotifications();
    const api = useApi();

    const ssoInfo: SSOInfo = {
        url: sso.SSOURL,
        entity: sso.SSOEntityID,
        certificate: sso.Certificate,
        type: sso.Type,
        edugainAffiliations: sso.EdugainAffiliations,
    };

    const [ssoDiff, setSsoDiff] = useState<Partial<SSOInfo>>({});
    const isFormDirty = Object.keys(ssoDiff).length;

    const [submitting, withSubmitting] = useLoading();

    const onChange = (key: keyof SSOInfo) => (value: string) => {
        setSsoDiff((diff) => {
            if (value === ssoInfo[key]) {
                delete diff[key];
                return { ...diff };
            }
            return {
                ...diff,
                [key]: value,
            };
        });
    };

    const url = ssoDiff.url ?? ssoInfo.url;
    const entity = ssoDiff.entity ?? ssoInfo.entity;
    const certificate = ssoDiff.certificate ?? ssoInfo.certificate;

    const isEdugain = sso.Type === IDP_TYPE.EDUGAIN;

    const edugainAffiliations = ssoDiff.edugainAffiliations ?? ssoInfo.edugainAffiliations;

    const edugainAffiliationsValue = edugainAffiliations
        .map((option) => EdugainAffiliationLabels[option as EdugainAffiliations])
        .join(', ');

    useEffect(() => {
        void metrics.core_sso_saml_info_page_load_total.increment({});
    }, []);

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        try {
            await api(
                updateSAMLConfig(sso.ID, {
                    DomainID: domain.ID,
                    SSOURL: url,
                    SSOEntityID: entity,
                    Certificate: certificate,
                })
            );

            await getSamlSSO({ cache: CacheType.None });
            setSsoDiff({});

            createNotification({ text: c('Info').t`SAML configuration saved` });

            metrics.core_sso_saml_update_info_total.increment({ status: 'success' });
        } catch (error) {
            observeApiError(error, (status) => {
                metrics.core_sso_saml_update_info_total.increment({ status });
            });
        }
    };

    if (isEdugain) {
        return (
            <>
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="ssoEntityID" className="text-semibold flex items-center gap-2">
                            <span>{c('Label').t`Entity ID`}</span>
                            <Info title={c('Tooltip').t`Display name for the entity in the eduGAIN database`} />
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="w-full">
                        <InputFieldTwo id="ssoEntityID" value={entity} readOnly />
                    </SettingsLayoutRight>
                </SettingsLayout>
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="ssoUserAffiliations" className="text-semibold flex items-center gap-2">
                            <span>{c('Label').t`User affiliations`}</span>
                            <Info
                                title={c('Tooltip')
                                    .t`Specify the users of the eduGAIN entity who are allowed to authenticate with SAML SSO`}
                            />
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="w-full">
                        <InputFieldTwo id="ssoUserAffiliations" value={edugainAffiliationsValue} readOnly />
                    </SettingsLayoutRight>
                </SettingsLayout>

                <div className="flex gap-4">
                    <Button color="norm" shape="outline" onClick={onImportSaml}>{c('Action')
                        .t`Change configuration`}</Button>
                    <Button color="norm" shape="outline" onClick={onTestSaml}>{c('Action')
                        .t`Test SAML configuration`}</Button>
                </div>
            </>
        );
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                void withSubmitting(handleSubmit());
            }}
        >
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="ssoUrl" className="text-semibold flex items-center gap-2">
                        <span>{c('Label').t`Single sign-on URL`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Endpoint URL from identity provider (e.g. https://idp.example.com/sso/saml)`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full">
                    <InputFieldTwo
                        id="ssoUrl"
                        value={url}
                        onValue={onChange('url')}
                        error={validator([requiredValidator(url)])}
                        disableChange={submitting}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="ssoEntity" className="text-semibold flex items-center gap-2">
                        <span>{c('Label').t`Single sign-on Entity ID`}</span>
                        <Info
                            title={c('Tooltip').t`Usually an URL that contains the identity provider's name within`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full">
                    <InputFieldTwo
                        id="ssoEntity"
                        value={entity}
                        onValue={onChange('entity')}
                        error={validator([requiredValidator(entity)])}
                        disableChange={submitting}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="ssoCertificate" className="text-semibold flex items-center gap-2">
                        <span>{c('Label').t`Public certificate (X.509)`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Identity provider’s public key to sign authentication assertions. Get the certificate hash from your identity provider.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full">
                    <InputFieldTwo
                        id="ssoCertificate"
                        as={TextAreaTwo}
                        rows={12}
                        value={certificate}
                        onValue={onChange('certificate')}
                        error={validator([requiredValidator(certificate)])}
                        disableChange={submitting}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="acsUrl" className="text-semibold flex items-center gap-2">
                        <span>{c('Label').t`Reply (ACS) URL`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Copy and paste this URL into the ACS (Assertion Consumer Service) URL field of your identity provider`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full">
                    <ReadonlyFieldWithCopy id="acsUrl" value={callbackURL} />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="acsUrl" className="text-semibold flex items-center gap-2">
                        <span>{c('Label').t`Issuer ID`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Copy and paste this URL into the Entity ID field of your identity provider`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full">
                    <ReadonlyFieldWithCopy id="acsUrl" value={issuerID} />
                </SettingsLayoutRight>
            </SettingsLayout>

            <div className="flex gap-4">
                <Button color="norm" shape="outline" onClick={onImportSaml}>{c('Action')
                    .t`Import new SAML metadata`}</Button>
                <Button color="norm" shape="outline" onClick={onTestSaml}>{c('Action')
                    .t`Test SAML configuration`}</Button>
                <Button color="norm" disabled={!isFormDirty} loading={submitting} type="submit">
                    {c('Action').t`Save SAML configuration`}
                </Button>
            </div>
        </form>
    );
};

export default SSOInfoForm;
