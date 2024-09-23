import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { wait } from '@proton/shared/lib/helpers/promise';
import clsx from '@proton/utils/clsx';

import type { WalletDrawerContextData, WalletDrawerContextValue } from '.';
import { WalletDrawerContext } from '.';
import { Drawer } from './Drawer';
import { WalletDiscoverContent } from './WalletDiscoverContent';
import { WalletReceiveContent } from './WalletReceiveContent';
import { WalletTransactionDataDrawer } from './WalletTransactionDataDrawer';

interface Props {
    children: ReactNode;
}

const styleByKind: Record<WalletDrawerContextData['kind'], { bg: 'bg-weak' | 'bg-norm'; width?: string }> = {
    ['discover']: { bg: 'bg-norm' },
    ['transaction-data']: { bg: 'bg-weak' },
    ['wallet-receive']: { bg: 'bg-norm' },
};

export const WalletDrawerContextProvider = ({ children }: Props) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerData, setDrawer] = useState<WalletDrawerContextValue['drawer']>();

    const closeDrawer = async () => {
        // We first close the drawer, then clear the data state. This prevents from having a drawer to rendered without expected data
        setIsDrawerOpen(false);
        await wait(300);
        setDrawer(undefined);
    };

    /**
     * Sets drawer data partially. Needs to have data initialised via openDrawer first.
     * Only update field that were initially set on drawer
     */
    const setDrawerData = (data: Partial<WalletDrawerContextData>) => {
        setDrawer((prev) => {
            if (prev) {
                const update = Object.entries(data).reduce((acc, [key, value]) => {
                    if (acc[key]) {
                        return {
                            ...acc,
                            [key]: value,
                        };
                    } else {
                        return acc;
                    }
                }, prev.data);

                return { data: update };
            } else {
                return prev;
            }
        });
    };

    /**
     * Close drawer if any opened and then sets new data
     */
    const openDrawerExt = (data: WalletDrawerContextData) => {
        if (drawerData) {
            void closeDrawer().then(() => {
                setDrawer({ data });
            });
        } else {
            setDrawer({ data });
        }
    };

    useEffect(() => {
        setIsDrawerOpen(!!drawerData);
    }, [drawerData]);

    const style = drawerData && styleByKind[drawerData?.data.kind];

    return (
        <WalletDrawerContext.Provider
            value={{ drawer: drawerData, isDrawerOpen, setDrawerData, openDrawer: openDrawerExt }}
        >
            {children}

            {drawerData && (
                <Drawer
                    open={isDrawerOpen}
                    onClose={closeDrawer}
                    style={{ '--w-custom': '24.125rem' }}
                    className={clsx('overflow-auto', drawerData.data.theme)}
                    bg={style?.bg}
                >
                    {drawerData.data.kind === 'transaction-data' && (
                        <WalletTransactionDataDrawer
                            networkDataAndHashedTxId={drawerData.data.networkDataAndHashedTxId}
                            onClickEditNote={drawerData.data.onClickEditNote}
                            onClickEditSender={drawerData.data.onClickEditSender}
                        />
                    )}

                    {drawerData.data.kind === 'discover' && drawerData.data && (
                        <WalletDiscoverContent wallet={drawerData.data.wallet} />
                    )}

                    {drawerData.data.kind === 'wallet-receive' && (
                        <WalletReceiveContent wallet={drawerData.data.wallet} account={drawerData.data.account} />
                    )}
                </Drawer>
            )}
        </WalletDrawerContext.Provider>
    );
};
