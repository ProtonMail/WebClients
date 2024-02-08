import { createContext, useContext, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useModalStateObject } from '@proton/components/components';
import { NOTIFICATION_DEFAULT_EXPIRATION_TIME } from '@proton/components/containers';
import { useNotifications, useSubscription } from '@proton/components/hooks';
import useAsyncError from '@proton/hooks/useAsyncError';
import useIsMounted from '@proton/hooks/useIsMounted';
import { usePassBridge } from '@proton/pass/lib/bridge/PassBridgeProvider';
import type { PassBridgeAliasItem } from '@proton/pass/lib/bridge/types';
import { deriveAliasPrefix } from '@proton/pass/lib/validation/alias';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import { hasFree, hasMailPlus, hasVpnPlus } from '@proton/shared/lib/helpers/subscription';

import { fetchPassBridgeInfos, filterPassAliases } from './PassAliases.helpers';
import { FAILED_TO_INIT_PASS_BRIDGE_ERROR } from './constant';
import type { CreateModalFormState, PassAliasesVault } from './interface';

/**
 * Memoize the pass aliases items to avoid displaying a loader on every drawer opening
 * In the long term we should have pass relying on the event loop.
 * However we decided to not go this way because implementation time
 */
let memoisedPassAliasesItems: PassBridgeAliasItem[] = [];

const usePassAliasesSetup = () => {
    const PassBridge = usePassBridge();
    const passAliasesUpsellModal = useModalStateObject();
    const isMounted = useIsMounted();
    const [subscription] = useSubscription();
    const [loading, setLoading] = useState<boolean>(memoisedPassAliasesItems.length ? false : true);
    const [passAliasVault, setPassAliasVault] = useState<PassAliasesVault>();
    const [passAliasesItems, setPassAliasesItems] = useState<PassBridgeAliasItem[]>(memoisedPassAliasesItems);
    const [userHadVault, setUserHadVault] = useState(false);
    const { createNotification } = useNotifications();
    const throwError = useAsyncError();
    const hasUnlimitedAliasesPlan: boolean = (() => {
        if (!subscription) {
            return false;
        }

        return !hasVpnPlus(subscription) && !hasMailPlus(subscription) && !hasFree(subscription);
    })();

    const submitNewAlias = async (formValues: CreateModalFormState) => {
        try {
            if (!passAliasVault) {
                throw new Error('Vault should be defined');
            }

            // Submit to API
            await PassBridge.alias.create({
                shareId: passAliasVault.shareId,
                name: formValues.name,
                ...(formValues.note ? { note: formValues.note } : {}),
                alias: {
                    mailbox: formValues.mailbox,
                    aliasEmail: formValues.alias,
                    prefix: deriveAliasPrefix(formValues.name),
                    signedSuffix: formValues.signedSuffix,
                },
            });

            // Refetch aliases and set new state
            const nextAliases = await PassBridge.alias.getAllByShareId(passAliasVault.shareId);
            const filteredAliases = filterPassAliases(nextAliases);

            if (isMounted()) {
                setPassAliasesItems(filteredAliases);
                memoisedPassAliasesItems = filteredAliases;
            }

            textToClipboard(formValues.alias);
            createNotification({
                text: c('Success').t`Alias saved and copied`,
                expiration: NOTIFICATION_DEFAULT_EXPIRATION_TIME,
            });
        } catch (e: any) {
            const error = getApiError(e);
            if (!hasUnlimitedAliasesPlan && error.code === API_CUSTOM_ERROR_CODES.CANT_CREATE_PASS_ALIAS) {
                setTimeout(() => {
                    passAliasesUpsellModal.openModal(true);
                }, NOTIFICATION_DEFAULT_EXPIRATION_TIME);
            } else {
                console.error(e);
                traceInitiativeError('drawer-security-center', e);
                createNotification({
                    text: c('Error').t`An error occurred while saving alias`,
                    type: 'error',
                    expiration: NOTIFICATION_DEFAULT_EXPIRATION_TIME,
                });
            }
        }
    };

    /**
     * Returns needed data to create an alias
     * @info Do not catch error here, it should be handled by the caller
     */
    const getAliasOptions = async () => {
        if (!passAliasVault) {
            throw new Error('Vault should be defined');
        }
        const options = await PassBridge.alias.getAliasOptions(passAliasVault.shareId);
        return options;
    };

    useEffect(() => {
        const initPassBridge = async () => {
            await PassBridge.ready();
            const { vault, aliases, userHadVault } = await fetchPassBridgeInfos(PassBridge);
            const filteredAliases = filterPassAliases(aliases);

            if (isMounted()) {
                setPassAliasVault(vault);
                setPassAliasesItems(filteredAliases);
                memoisedPassAliasesItems = filteredAliases;
                setUserHadVault(userHadVault);
                setLoading(false);
            }
        };
        void initPassBridge().catch((e) => {
            createNotification({
                text: c('Error').t`Aliases could not be loaded`,
                type: 'error',
            });
            traceInitiativeError('drawer-security-center', e);

            throwError(new Error(FAILED_TO_INIT_PASS_BRIDGE_ERROR));
        });
    }, []);

    return {
        getAliasOptions,
        hasAliases: !!passAliasesItems.length,
        hasUsedProtonPassApp: userHadVault,
        loading,
        submitNewAlias,
        passAliasesVaultName: passAliasVault?.content.name || '',
        passAliasesItems,
        passAliasesUpsellModal,
    };
};

const PassAliasesContext = createContext<ReturnType<typeof usePassAliasesSetup> | undefined>(undefined);

export const PassAliasesProvider = ({ children }: { children: React.ReactNode }) => {
    const passAliasesSetup = usePassAliasesSetup();

    return <PassAliasesContext.Provider value={passAliasesSetup}>{children}</PassAliasesContext.Provider>;
};

/**
 * Expose method calling the PassBridge API
 */
export const usePassAliasesContext = () => {
    const context = useContext(PassAliasesContext);

    if (context === undefined) {
        throw new Error('usePassAliases must be used within a PassAliasesProvider');
    }

    return context;
};
