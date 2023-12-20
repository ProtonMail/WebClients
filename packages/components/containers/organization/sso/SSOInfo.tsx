import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import useLoading from '@proton/hooks/useLoading';
import { updateSAMLConfig } from '@proton/shared/lib/api/samlSSO';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { isEquivalent } from '@proton/shared/lib/helpers/object';
import { Domain, SSO } from '@proton/shared/lib/interfaces';

import { Info, InputFieldTwo, TextAreaTwo, useFormErrors } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '../../account';
import ReadonlyFieldWithCopy from './ReadonlyFieldWithCopy';

interface SSOInfoState {
    url: string;
    entity: string;
    certificate: string;
}

interface Props {
    domain: Domain;
    sso: SSO;
    onImportSamlClick: () => void;
}

const SSOInfo = ({ domain, sso, onImportSamlClick }: Props) => {
    const { onFormSubmit, validator } = useFormErrors();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const api = useApi();

    const defaultSSOInfo: SSOInfoState = {
        url: sso.SSOURL,
        entity: sso.SSOEntityID,
        certificate: sso.Certificate,
    };

    const [ssoInfo, setSsoInfo] = useState<SSOInfoState>(defaultSSOInfo);

    const isFormDirty = !isEquivalent(ssoInfo, defaultSSOInfo);

    const [submitting, withSubmitting] = useLoading();

    const onChange = (key: keyof SSOInfoState) => (value: string) => {
        setSsoInfo((info) => ({
            ...info,
            [key]: value,
        }));
    };

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        const { url, entity, certificate } = ssoInfo;
        await api(
            updateSAMLConfig(sso.SSOID, {
                DomainID: domain.ID,
                SSOURL: url,
                SSOEntityID: entity,
                Certificate: certificate,
            })
        );

        await call();

        createNotification({ text: c('Info').t`SAML configuration saved` });
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
                    <label htmlFor="ssoUrl" className="text-semibold align-top">
                        <span className="mr-2">{c('Label').t`Single Sign-On URL`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Endpoint URL from Identity Provider (e.g. https://idp.example.com/sso/saml)`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full">
                    <InputFieldTwo
                        id="ssoUrl"
                        value={ssoInfo.url}
                        onValue={onChange('url')}
                        error={validator([requiredValidator(ssoInfo.url)])}
                        disableChange={submitting}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="ssoEntity" className="text-semibold align-top">
                        <span className="mr-2">{c('Label').t`Single Sign-On Entity ID`}</span>
                        <Info
                            title={c('Tooltip').t`Usually an URL that contains the Identity Provider's name within`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full">
                    <InputFieldTwo
                        id="ssoEntity"
                        value={ssoInfo.entity}
                        onValue={onChange('entity')}
                        error={validator([requiredValidator(ssoInfo.entity)])}
                        disableChange={submitting}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="ssoCertificate" className="text-semibold align-top">
                        <span className="mr-2">{c('Label').t`Public certificate (X.509)`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Identity Provider’s public key to sign authentication assertions. Get the certificate hash from your Identity Provider.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full">
                    <InputFieldTwo
                        id="ssoCertificate"
                        as={TextAreaTwo}
                        rows={12}
                        value={ssoInfo.certificate}
                        onValue={onChange('certificate')}
                        error={validator([requiredValidator(ssoInfo.certificate)])}
                        disableChange={submitting}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="acsUrl" className="text-semibold align-top">
                        <span className="mr-2">{c('Label').t`Reply (ACS) URL`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Copy and paste this URL into the ACS (Assertion Consumer Service) URL field of your Identity Provider`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full">
                    <ReadonlyFieldWithCopy id="acsUrl" value={sso.CallbackURL} />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="acsUrl" className="text-semibold align-top">
                        <span className="mr-2">{c('Label').t`Issuer ID`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Copy and paste this URL into the Entity ID field of your Identity Provider`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full">
                    <ReadonlyFieldWithCopy id="acsUrl" value={sso.IssuerID} />
                </SettingsLayoutRight>
            </SettingsLayout>

            <div className="flex gap-4">
                <Button onClick={onImportSamlClick}>{c('Action').t`Import new SAML metadata`}</Button>
                <Button color="norm" disabled={!isFormDirty} loading={submitting} type="submit">
                    {c('Action').t`Save SAML configuration`}
                </Button>
            </div>
        </form>
    );
};

export default SSOInfo;
