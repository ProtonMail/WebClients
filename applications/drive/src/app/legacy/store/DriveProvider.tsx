import type { ReactNode } from 'react';

import { SpotlightProvider } from '../components/useSpotlight';
import { DevicesProvider } from './_devices';
import { LinksProvider } from './_links';
import { SharesProvider } from './_shares';
import { VolumesProvider } from './_volumes';

interface DriveProviderProps {
    children: ReactNode;
}

export function DriveProvider({ children }: DriveProviderProps) {
    return (
        <VolumesProvider>
            <SharesProvider>
                <LinksProvider>
                    <DevicesProvider>
                        <SpotlightProvider>{children}</SpotlightProvider>
                    </DevicesProvider>
                </LinksProvider>
            </SharesProvider>
        </VolumesProvider>
    );
}
