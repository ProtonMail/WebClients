import { ReactNode, useEffect, useState } from 'react';

import { wait } from '@proton/shared/lib/helpers/promise';

import { WalletDrawerContext, WalletDrawerContextData, WalletDrawerContextValue } from '.';
import { Drawer } from './Drawer';
import { WalletDiscoverContent } from './WalletDiscoverContent';
import { WalletTransactionDataDrawer } from './WalletTransactionDataContent';

interface Props {
    children: ReactNode;
}

export const WalletDrawerContextProvider = ({ children }: Props) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerData, setDrawer] = useState<WalletDrawerContextValue['drawer']>();

    const closeDrawer = async () => {
        // We first close the drawer, then clear the data state. This prevents from having a drawer to rendered without expected data
        setIsDrawerOpen(false);
        await wait(300);
        setDrawer(undefined);
    };

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

    return (
        <WalletDrawerContext.Provider value={{ drawer: drawerData, openDrawer: openDrawerExt }}>
            {children}

            {drawerData && (
                <Drawer
                    open={isDrawerOpen}
                    onClose={closeDrawer}
                    style={{ '--w-custom': '24rem' }}
                    className="overflow-auto"
                    bg={'discover' in drawerData.data ? 'bg-norm' : 'bg-weak'}
                >
                    {'transaction' in drawerData.data && (
                        <WalletTransactionDataDrawer transaction={drawerData.data.transaction} />
                    )}

                    {'discover' in drawerData.data && <WalletDiscoverContent wallet={drawerData.data.wallet} />}
                </Drawer>
            )}
        </WalletDrawerContext.Provider>
    );
};
