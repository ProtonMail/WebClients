import type { FC, PropsWithChildren } from 'react';
import { createContext, useState } from 'react';

import type { UpsellRef } from '../../constants';
import { createUseContext } from '../../hooks/useContextFactory';
import type { MaybeNull } from '../../types';
import type { UpsellType } from './UpsellingModal';
import { UpsellingModal } from './UpsellingModal';

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
