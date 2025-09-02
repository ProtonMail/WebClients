import type { FC, PropsWithChildren } from 'react';
import { createContext, useState } from 'react';

import type { UpsellType } from '@proton/pass/components/Upsell/UpsellingModal';
import { UpsellingModal } from '@proton/pass/components/Upsell/UpsellingModal';
import type { UpsellRef } from '@proton/pass/constants';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { MaybeNull } from '@proton/pass/types';

type UpsellingState = { type: UpsellType; upsellRef: UpsellRef };
type UpsellFn = (value: MaybeNull<UpsellingState>) => void;

export const UpsellingContext = createContext<MaybeNull<UpsellFn>>(null);

export const UpsellingProvider: FC<PropsWithChildren> = ({ children }) => {
    const [upselling, setUpselling] = useState<MaybeNull<UpsellingState>>(null);

    return (
        <UpsellingContext.Provider value={setUpselling}>
            {children}
            {upselling && (
                <UpsellingModal
                    open
                    onClose={() => setUpselling(null)}
                    upsellType={upselling.type}
                    upsellRef={upselling.upsellRef}
                />
            )}
        </UpsellingContext.Provider>
    );
};

export const useUpselling = createUseContext(UpsellingContext);
