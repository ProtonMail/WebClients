import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useLoading from '@proton/hooks/useLoading';
import metrics, { observeApiError } from '@proton/metrics';
import { updateSAMLConfig } from '@proton/shared/lib/api/samlSSO';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Domain, SSO } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

import { Info, InputFieldTwo, TextAreaTwo, useFormErrors } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '../../account';
import type { IdentityProviderEndpointsContentProps } from './IdentityProviderEndpointsContent';
import ReadonlyFieldWithCopy from './ReadonlyFieldWithCopy';

interface SSOInfo {
    url: string;
    entity: string;
    certificate: string;
}

interface Props extends IdentityProviderEndpointsContentProps {
    domain: Domain;
    sso: SSO;
    onImportSaml: () => void;
    onTestSaml: () => void;
}

const SSOInfoForm = ({ domain, sso, issuerID, callbackURL, onImportSaml, onTestSaml }: Props) => {
    const { onFormSubmit, validator } = useFormErrors();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const api = useApi();
    const samlTestEnabled = useFlag('SamlTest');

    const ssoInfo: SSOInfo = {
        url: sso.SSOURL,
        entity: sso.SSOEntityID,
        certificate: sso.Certificate,
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

            await call();
            setSsoDiff({});

            createNotification({ text: c('Info').t`SAML configuration saved` });

            metrics.core_sso_saml_update_info_total.increment({ status: 'success' });
        } catch (error) {
            observeApiError(error, (status) => {
                metrics.core_sso_saml_update_info_total.increment({ status });
            });
        }
    };

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
                        <span>{c('Label').t`Single sign-on entity ID`}</span>
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
                                .t`Copy and paste this URL into the entity ID field of your identity provider`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full">
                    <ReadonlyFieldWithCopy id="acsUrl" value={issuerID} />
                </SettingsLayoutRight>
            </SettingsLayout>

            <div className="flex gap-4">
                <Button onClick={onImportSaml}>{c('Action').t`Import new SAML metadata`}</Button>
                {samlTestEnabled && <Button onClick={onTestSaml}>{c('Action').t`Test SAML configuration`}</Button>}
                <Button color="norm" disabled={!isFormDirty} loading={submitting} type="submit">
                    {c('Action').t`Save SAML configuration`}
                </Button>
            </div>
        </form>
    );
};

export default SSOInfoForm;
