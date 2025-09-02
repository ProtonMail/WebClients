import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Spotlight } from '@proton/components';

export interface SaveForLaterSpotlightProps {
    children: ReactNode;
    showSpotlight: boolean;
}

export const SaveForLaterSpotlight = ({ children, showSpotlight }: SaveForLaterSpotlightProps) => {
    return (
        <Spotlight
            show={showSpotlight}
            content={c('Spotlight')
                .t`A link to this item has been saved in your drive. You can access it later in the 'Shared with me' section.`}
            originalPlacement="bottom-end"
        >
            {children}
        </Spotlight>
    );
};
