import { useState } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { SamlState } from '@proton/account';
import { disableSCIMAction, setupSCIMAction } from '@proton/account/samlSSO/actions';
import { Button } from '@proton/atoms/Button';
import useLoading from '@proton/hooks/useLoading';
import { type ProtonThunkArguments, baseUseDispatch } from '@proton/redux-shared-store';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import { Icon, Info, useModalState } from '../../../../components';
import getBoldFormattedText from '../../../../helpers/getBoldFormattedText';
import { useApi } from '../../../../hooks';
import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    SettingsParagraph,
    SettingsSectionWide,
} from '../../../account';
import { SubSettingsSection } from '../../../layout';
import useFlag from '../../../unleash/useFlag';
import ReadonlyFieldWithCopy from '../ReadonlyFieldWithCopy';
import DisableSCIMModal from './DisableSCIMModal';
import RegenerateSCIMConfirmModal from './RegenerateSCIMConfirmModal';
import SetupSCIMModal, { SCIMConfiguration } from './SetupSCIMModal';

interface Props {
    onConfigureSaml: () => void;
    hasSsoConfig: boolean;
    scimInfo: NonNullable<SamlState['sso']['value']>['scimInfo'];
}

const SCIMSettingsSection = ({ onConfigureSaml, hasSsoConfig, scimInfo }: Props) => {
    const api = useApi();
    const isScimEnabled = useFlag('ScimTenantCreation');
    const dispatch = baseUseDispatch<ThunkDispatch<SamlState, ProtonThunkArguments, Action>>();

    const [setupSCIMModalProps, setSetupSCIMModalOpen, renderSetupSCIMModal] = useModalState();
    const [regenerateSCIMModalProps, setRegenerateSCIMModalOpen, renderRegenerateSCIMModal] = useModalState();
    const [disableSCIMModalProps, setDisableSCIMModalOpen, renderDisableSCIMModal] = useModalState();
    const [localSCIMConfiguration, setLocalSCIMConfiguration] = useState<SCIMConfiguration>();
    const [loadingSCIM, withLoadingSCIM] = useLoading();

    if (!isScimEnabled) {
        return null;
    }

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
                                <div className="rounded border bg-weak p-4 flex justify-space-between gap-2 items-center lg:flex-nowrap">
                                    <div className="flex gap-2 items-start flex-nowrap">
                                        <Icon name="info-circle" className="shrink-0" />
                                        <p className="m-0">
                                            {getBoldFormattedText(
                                                c('scim: Info')
                                                    .t`**Prerequisite:** SAML authentication must be configured to enable SCIM provisioning.`
                                            )}
                                        </p>
                                    </div>
                                    <Button
                                        color="weak"
                                        shape="solid"
                                        size="small"
                                        className="shrink-0"
                                        onClick={onConfigureSaml}
                                    >
                                        {c('Action').t`Configure SAML`}
                                    </Button>
                                </div>
                            );
                        }

                        if (!scimInfo.state) {
                            return (
                                <>
                                    <SettingsLayout>
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
                                                };
                                                void withLoadingSCIM(run());
                                            }}
                                            loading={loadingSCIM}
                                        >
                                            {c('scim: Action').t`Configure SCIM`}
                                        </Button>
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
                    }}
                />
            )}
        </>
    );
};

export default SCIMSettingsSection;
