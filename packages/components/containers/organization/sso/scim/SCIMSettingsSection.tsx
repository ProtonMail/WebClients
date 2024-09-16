import type { ReactNode } from 'react';
import { useState } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { SamlState } from '@proton/account';
import { disableSCIMAction, setupSCIMAction } from '@proton/account/samlSSO/actions';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import useLoading from '@proton/hooks/useLoading';
import { baseUseDispatch } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import type { Domain } from '@proton/shared/lib/interfaces';
import { DOMAIN_STATE } from '@proton/shared/lib/interfaces';

import { Info, useModalState } from '../../../../components';
import getBoldFormattedText from '../../../../helpers/getBoldFormattedText';
import { useApi, useNotifications } from '../../../../hooks';
import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    SettingsParagraph,
    SettingsSectionWide,
} from '../../../account';
import { SubSettingsSection } from '../../../layout';
import ReadonlyFieldWithCopy from '../ReadonlyFieldWithCopy';
import DisableSCIMModal from './DisableSCIMModal';
import RegenerateSCIMConfirmModal from './RegenerateSCIMConfirmModal';
import type { SCIMConfiguration } from './SetupSCIMModal';
import SetupSCIMModal from './SetupSCIMModal';

interface Props {
    domain?: Domain;
    onConfigureSaml: () => void;
    onShowVerifyDomain: () => void;
    hasSsoConfig: boolean;
    scimInfo: NonNullable<SamlState['sso']['value']>['scimInfo'];
}

const PreReq = ({ data, action }: { data: ReactNode; action: ReactNode }) => {
    return (
        <div className="rounded border bg-weak p-4 flex justify-space-between gap-2 items-center lg:flex-nowrap">
            <div className="flex gap-2 items-start flex-nowrap">
                <Icon name="info-circle" className="shrink-0" />
                <p className="m-0">{data}</p>
            </div>
            {action}
        </div>
    );
};

const SCIMSettingsSection = ({ domain, onConfigureSaml, onShowVerifyDomain, hasSsoConfig, scimInfo }: Props) => {
    const api = useApi();
    const dispatch = baseUseDispatch<ThunkDispatch<SamlState, ProtonThunkArguments, Action>>();
    const { createNotification } = useNotifications();

    const [setupSCIMModalProps, setSetupSCIMModalOpen, renderSetupSCIMModal] = useModalState();
    const [regenerateSCIMModalProps, setRegenerateSCIMModalOpen, renderRegenerateSCIMModal] = useModalState();
    const [disableSCIMModalProps, setDisableSCIMModalOpen, renderDisableSCIMModal] = useModalState();
    const [localSCIMConfiguration, setLocalSCIMConfiguration] = useState<SCIMConfiguration>();
    const [loadingSCIM, withLoadingSCIM] = useLoading();

    return (
        <>
            <SubSettingsSection
                id="scim-automatic-provisioning"
                title={c('scim: Title').t`SCIM automatic provisioning`}
                className="container-section-sticky-section"
                beta
            >
                <SettingsSectionWide>
                    <SettingsParagraph learnMoreUrl="">
                        {c('scim: Info')
                            .t`Simplifies user management across different services. Add, edit, and remove users in your identity provider, and those changes will automatically be applied to your ${VPN_APP_NAME} organization.`}
                    </SettingsParagraph>

                    {(() => {
                        if (!hasSsoConfig) {
                            return (
                                <PreReq
                                    data={getBoldFormattedText(
                                        c('scim: Info')
                                            .t`**Prerequisite:** SAML authentication must be configured to enable SCIM provisioning.`
                                    )}
                                    action={
                                        <Button
                                            color="weak"
                                            shape="solid"
                                            size="small"
                                            className="shrink-0"
                                            onClick={onConfigureSaml}
                                        >
                                            {c('Action').t`Configure SAML`}
                                        </Button>
                                    }
                                />
                            );
                        }

                        if (!scimInfo.state) {
                            const domainName = domain?.DomainName || '';
                            const isVerified = domain?.State !== DOMAIN_STATE.DOMAIN_STATE_DEFAULT;
                            return (
                                <>
                                    <SettingsLayout>
                                        {!isVerified ? (
                                            <PreReq
                                                data={getBoldFormattedText(
                                                    c('scim: Info')
                                                        .t`**Prerequisite:** to enable SCIM provisioning, you must verify ownership of the domain **${domainName}**. This verification can take up to one hour.`
                                                )}
                                                action={
                                                    <Button
                                                        color="weak"
                                                        shape="solid"
                                                        size="small"
                                                        className="shrink-0"
                                                        onClick={onShowVerifyDomain}
                                                    >
                                                        {c('Action').t`Verify domain`}
                                                    </Button>
                                                }
                                            />
                                        ) : (
                                            <Button
                                                color="norm"
                                                shape="outline"
                                                className="shrink-0 grow-0"
                                                onClick={() => {
                                                    const run = async () => {
                                                        const result = await dispatch(
                                                            setupSCIMAction({
                                                                type: 'setup',
                                                                api,
                                                            })
                                                        );
                                                        setLocalSCIMConfiguration({ ...result, type: 'setup' });
                                                        setSetupSCIMModalOpen(true);
                                                        createNotification({ text: c('Info').t`SCIM token active` });
                                                    };
                                                    void withLoadingSCIM(run());
                                                }}
                                                loading={loadingSCIM}
                                            >
                                                {c('scim: Action').t`Configure SCIM`}
                                            </Button>
                                        )}
                                    </SettingsLayout>
                                </>
                            );
                        }

                        return (
                            <>
                                <SettingsLayout>
                                    <SettingsLayoutLeft>
                                        <label htmlFor="scimURL" className="text-semibold flex items-center gap-2">
                                            <span>{c('scim: Label').t`SCIM base URL`}</span>
                                            <Info
                                                title={c('scim: Tooltip')
                                                    .t`URL of the SCIM connector to which your IdP Provisioning Agent forwards SCIM data`}
                                            />
                                        </label>
                                    </SettingsLayoutLeft>
                                    <SettingsLayoutRight className="w-full">
                                        <ReadonlyFieldWithCopy id="scimURL" value={scimInfo.baseUrl} />
                                    </SettingsLayoutRight>
                                </SettingsLayout>
                                <SettingsLayout>
                                    <SettingsLayoutLeft>
                                        <label htmlFor="scimToken" className="text-semibold flex items-center gap-2">
                                            <span>{c('scim: Label').t`SCIM token`}</span>
                                            <Info
                                                title={c('scim: Tooltip')
                                                    .t`API key of the SCIM connector to which your IdP Provisioning Agent forwards SCIM data`}
                                            />
                                        </label>
                                    </SettingsLayoutLeft>
                                    <SettingsLayoutRight className="w-full">
                                        <div className="flex items-center gap-2 mb-4 mt-2">
                                            <Icon name="eye-slash" className="shrink-0" />
                                            <p className="m-0">{c('scim: Info')
                                                .t`For security reasons, the token is hidden`}</p>
                                        </div>

                                        <div className="border rounded p-4 flex items-start lg:flex-nowrap gap-2">
                                            {c('scim: Info')
                                                .t`If you've lost or forgotten the SCIM token, you can generate a new one, but be aware that your identity provider settings will need to be updated.`}
                                            <Button
                                                color="weak"
                                                shape="outline"
                                                size="small"
                                                className="shrink-0 grow-0"
                                                onClick={() => setRegenerateSCIMModalOpen(true)}
                                                loading={loadingSCIM}
                                            >
                                                <Icon name="arrow-rotate-right" className="shrink-0 mr-1" />
                                                {c('scim: Action').t`Generate new token`}
                                            </Button>
                                        </div>
                                    </SettingsLayoutRight>
                                </SettingsLayout>

                                <Button color="danger" shape="outline" onClick={() => setDisableSCIMModalOpen(true)}>
                                    {c('scim: Action').t`Disable SCIM integration`}
                                </Button>
                            </>
                        );
                    })()}
                </SettingsSectionWide>
            </SubSettingsSection>

            {renderSetupSCIMModal && localSCIMConfiguration && (
                <SetupSCIMModal {...setupSCIMModalProps} {...localSCIMConfiguration} />
            )}
            {renderRegenerateSCIMModal && (
                <RegenerateSCIMConfirmModal
                    {...regenerateSCIMModalProps}
                    onConfirm={async () => {
                        const result = await dispatch(
                            setupSCIMAction({
                                type: 'generated',
                                api,
                            })
                        );
                        setLocalSCIMConfiguration({ ...result, type: 'generated' });
                        setSetupSCIMModalOpen(true);
                        regenerateSCIMModalProps.onClose();
                        createNotification({ text: c('Info').t`SCIM token active` });
                    }}
                />
            )}
            {renderDisableSCIMModal && (
                <DisableSCIMModal
                    {...disableSCIMModalProps}
                    onConfirm={async () => {
                        await dispatch(
                            disableSCIMAction({
                                api,
                            })
                        );
                        setLocalSCIMConfiguration(undefined);
                        disableSCIMModalProps.onClose();
                        createNotification({ text: c('Info').t`SCIM integration disabled` });
                    }}
                />
            )}
        </>
    );
};

export default SCIMSettingsSection;
