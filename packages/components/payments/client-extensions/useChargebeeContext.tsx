import { type MutableRefObject, createContext, useContext } from 'react';

import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

export type CalledKillSwitchString = 'called' | 'not-called';

export type ChargebeeContext = {
    enableChargebeeRef: MutableRefObject<ChargebeeEnabled>;
    calledKillSwitch: CalledKillSwitchString;
    setCalledKillSwitch: (value: CalledKillSwitchString) => unknown;
};

export const PaymentSwitcherContext = createContext<ChargebeeContext>({
    enableChargebeeRef: {
        current: ChargebeeEnabled.CHARGEBEE_FORCED,
    },
    calledKillSwitch: 'not-called',
    setCalledKillSwitch: () => {},
});

export const useChargebeeContext = () => {
    return useContext(PaymentSwitcherContext);
};

export const useChargebeeEnabledCache = () => {
    const chargebeeContext = useChargebeeContext();
    return (): ChargebeeEnabled => chargebeeContext.enableChargebeeRef.current;
};
