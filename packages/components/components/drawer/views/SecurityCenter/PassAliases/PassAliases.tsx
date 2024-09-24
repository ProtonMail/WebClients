import { useMemo } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import { GenericErrorDisplay } from '@proton/components/containers/error/GenericError';
import { useApi, useAuthentication } from '@proton/components/hooks';
import { encodeFilters } from '@proton/pass/components/Navigation/routing';
import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { PassBridgeProvider } from '@proton/pass/lib/bridge/PassBridgeProvider';
import { TelemetrySecurityCenterEvents } from '@proton/shared/lib/api/telemetry';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, PASS_APP_NAME } from '@proton/shared/lib/constants';
import aliasSampleSvg from '@proton/styles/assets/img/illustrations/pass-aliases-alias-sample.svg';
import clsx from '@proton/utils/clsx';

import DrawerAppSection from '../../shared/DrawerAppSection';
import { DRAWER_PASS_ALIASES_CREATE_ALIAS_MODAL_CTA_ID } from '../constants';
import { sendSecurityCenterReport } from '../securityCenterTelemetry';
import AliasesList from './AliasesList';
import HasNoAliases from './HasNoAliases';
import { PASS_ALIASES_ERROR_STEP } from './PassAliasesError';
import { PassAliasesProvider, usePassAliasesContext } from './PassAliasesProvider';
import CreatePassAliasesForm from './modals/CreatePassAliasesForm/CreatePassAliasesForm';
import PassAliasesUpsellModal from './modals/PassAliasesUpsellModal';
import TryProtonPass from './modals/TryProtonPass';

const PassAliases = () => {
    const api = useApi();
    const createAliasModal = useModalStateObject();
    const tryProtonPassModal = useModalStateObject();
    const {
        hasAliases,
        hasUsedProtonPassApp,
        loading,
        passAliasesItems,
        passAliasesUpsellModal,
        hasReachedAliasesCountLimit: hasReachedAliasesLimit,
        hadInitialisedPreviously,
    } = usePassAliasesContext();
    const authentication = useAuthentication();

    const passAliasesURL = useMemo(() => {
        const search = new URLSearchParams();
        search.set(
            'filters',
            encodeFilters({
                type: 'alias',
                sort: 'recent',
                selectedShareId: null,
                search: '',
            })
        );

        return getAppHref(`?${search.toString()}`, APPS.PROTONPASS, authentication?.getLocalID?.());
    }, []);

    if (loading && !hadInitialisedPreviously) {
        return (
            <DrawerAppSection>
                <Loader size="medium" className="color-primary m-auto" />
            </DrawerAppSection>
        );
    }

    return (
        <>
            <DrawerAppSection>
                {hasAliases ? <AliasesList items={passAliasesItems} /> : <HasNoAliases />}

                <div className={clsx('text-center mb-2', !hasAliases && 'mt-2')}>
                    {hasAliases && (
                        <ButtonLike
                            as="a"
                            className="mb-4 w-full inline-flex items-center justify-center"
                            shape="underline"
                            color="weak"
                            size="small"
                            href={passAliasesURL}
                            disabled={!passAliasesURL}
                            target="_blank"
                        >
                            {c('Security Center').t`All aliases`}
                            <Icon
                                name="arrow-out-square"
                                className="ml-1"
                                alt={c('Security Center (link to Pass App)').t`(will open ${PASS_APP_NAME})`}
                            />
                        </ButtonLike>
                    )}
                    <Button
                        onClick={() => {
                            if (hasReachedAliasesLimit) {
                                passAliasesUpsellModal.openModal(true);
                            } else {
                                createAliasModal.openModal(true);
                            }
                        }}
                        color="norm"
                        fullWidth
                        loading={loading}
                        id={DRAWER_PASS_ALIASES_CREATE_ALIAS_MODAL_CTA_ID}
                    >
                        {!hasAliases ? c('Security Center').t`Create an alias` : c('Security Center').t`New alias`}
                    </Button>
                </div>
            </DrawerAppSection>
            {createAliasModal.render && (
                <CreatePassAliasesForm
                    onSubmit={() => {
                        createAliasModal.openModal(false);

                        void sendSecurityCenterReport(api, {
                            event: TelemetrySecurityCenterEvents.proton_pass_create_alias,
                            dimensions: { first_alias: hasAliases ? 'no' : 'yes' },
                        });

                        // Wait for notification to be closed
                        if (!hasUsedProtonPassApp && !hasAliases) {
                            tryProtonPassModal.openModal(true);
                        }
                    }}
                    modalProps={createAliasModal.modalProps}
                    passAliasesURL={passAliasesURL}
                />
            )}
            {tryProtonPassModal.render && <TryProtonPass modalProps={tryProtonPassModal.modalProps} />}
            {passAliasesUpsellModal.render && <PassAliasesUpsellModal modalProps={passAliasesUpsellModal.modalProps} />}
        </>
    );
};

export default function PassAliasesWrapper() {
    return (
        <ErrorBoundary
            initiative="drawer-security-center"
            renderFunction={(e: any) => {
                const status = (() => {
                    if (e?.message.includes(PassErrorCode.MISSING_SCOPE)) {
                        return 'missing-scope-error';
                    }
                    if (e?.name === PASS_ALIASES_ERROR_STEP.INIT_BRIDGE) {
                        return 'init-bridge-error';
                    }
                    return 'default-error';
                })();

                return (
                    <>
                        {status === 'missing-scope-error' && (
                            <DrawerAppSection>
                                <GenericErrorDisplay title={''} customImage={aliasSampleSvg}>
                                    <div className="text-weak text-sm color-weak text-center">
                                        {c('Error message')
                                            .t`When extra password is enabled, alias management can only be done in ${PASS_APP_NAME}.`}
                                    </div>
                                </GenericErrorDisplay>
                            </DrawerAppSection>
                        )}

                        {status === 'init-bridge-error' && (
                            <GenericErrorDisplay title={c('Error').t`Aliases could not be loaded`}>
                                <div className="text-weak text-sm">
                                    {c('Error message').t`Please refresh the page or try again later.`}
                                </div>
                            </GenericErrorDisplay>
                        )}

                        {status === 'default-error' && <GenericErrorDisplay />}
                    </>
                );
            }}
        >
            <PassBridgeProvider>
                <PassAliasesProvider>
                    <PassAliases />
                </PassAliasesProvider>
            </PassBridgeProvider>
        </ErrorBoundary>
    );
}
