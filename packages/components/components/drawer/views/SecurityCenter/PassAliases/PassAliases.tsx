import React, { useMemo } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { Loader, useModalStateObject } from '@proton/components/components';
import { ErrorBoundary, NOTIFICATION_DEFAULT_EXPIRATION_TIME } from '@proton/components/containers';
import { GenericErrorDisplay } from '@proton/components/containers/error/GenericError';
import { useAuthentication } from '@proton/components/hooks';
import { encodeFilters } from '@proton/pass/components/Navigation/routing';
import { PassBridgeProvider } from '@proton/pass/lib/bridge/PassBridgeProvider';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { DrawerAppSection } from '../../shared';
import AliasesList from './AliasesList';
import HasNoAliases from './HasNoAliases';
import { FAILED_TO_INIT_PASS_BRIDGE_ERROR } from './PassAliasesInitError';
import { PassAliasesProvider, usePassAliasesContext } from './PassAliasesProvider';
import CreatePassAliasesForm from './modals/CreatePassAliasesForm/CreatePassAliasesForm';
import PassAliasesUpsellModal from './modals/PassAliasesUpsellModal';
import TryProtonPass from './modals/TryProtonPass';

const PassAliases = () => {
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
                            className="mb-4 w-full"
                            shape="underline"
                            color="weak"
                            size="small"
                            href={passAliasesURL}
                            disabled={!passAliasesURL}
                            target="_blank"
                        >{c('Security Center').t`All aliases`}</ButtonLike>
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
                    >
                        {!hasAliases ? c('Security Center').t`Create an alias` : c('Security Center').t`New alias`}
                    </Button>
                </div>
            </DrawerAppSection>
            {createAliasModal.render && (
                <CreatePassAliasesForm
                    onSubmit={() => {
                        createAliasModal.openModal(false);

                        // Wait for notification to be closed
                        if (!hasUsedProtonPassApp && !hasAliases) {
                            setTimeout(() => {
                                tryProtonPassModal.openModal(true);
                            }, NOTIFICATION_DEFAULT_EXPIRATION_TIME);
                        }
                    }}
                    modalProps={createAliasModal.modalProps}
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
            renderFunction={(e) => (
                <>
                    {e?.name === FAILED_TO_INIT_PASS_BRIDGE_ERROR ? (
                        <GenericErrorDisplay title={c('Error').t`Aliases could not be loaded`}>
                            <div className="text-weak text-sm">
                                {c('Error message').t`Please refresh the page or try again later.`}
                            </div>
                        </GenericErrorDisplay>
                    ) : (
                        <GenericErrorDisplay />
                    )}
                </>
            )}
        >
            <PassBridgeProvider>
                <PassAliasesProvider>
                    <PassAliases />
                </PassAliasesProvider>
            </PassBridgeProvider>
        </ErrorBoundary>
    );
}
