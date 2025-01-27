import { type ReactNode } from 'react';

import { c } from 'ttag';

import { Icon, Spotlight } from '@proton/components/index';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

export enum SaveForLaterSpotlightVersion {
    UPSELL = 'upsell',
    BOOKMARKED = 'bookmarked',
    HIDE = 'hide',
}

export interface SaveForLaterSpotlightProps {
    children: ReactNode;
    spotlightVersion: SaveForLaterSpotlightVersion;
}

const UspellContent = () => (
    <div className="pl-3 py-4">
        <h2 className="text-lg text-bold mb-2">{c('Title').t`Save it for later in  ${DRIVE_APP_NAME}`}</h2>
        <p className="text-weak mb-3">{c('Description')
            .t`Keep your files, photos and documents secure with end-to-end encryption.`}</p>
        <ul className="unstyled m-0">
            <li className="flex items-center py-4 border-bottom border-weak	">
                <Icon size={7} className="color-primary mr-2" name="storage" />
                <p>{c('Feature').t`Free 5 GB storage`}</p>
            </li>
            <li className="flex items-center py-4 border-bottom border-weak	">
                <Icon size={7} className="color-primary mr-2" name="star" />
                <p>{c('Feature').t`Save files for later access`}</p>
            </li>
            <li className="flex items-center py-4 border-bottom border-weak	">
                <Icon size={7} className="color-primary mr-2" name="tv" />
                <p>{c('Feature').t`Access on mobile and desktop`}</p>
            </li>
            <li className="flex items-center py-4">
                <Icon size={7} className="color-primary mr-2" name="link" />
                <p>{c('Feature').t`Share privately and securely`}</p>
            </li>
        </ul>
    </div>
);

export const SaveForLaterSpotlight = ({ children, spotlightVersion }: SaveForLaterSpotlightProps) => {
    return (
        <Spotlight
            show={spotlightVersion !== SaveForLaterSpotlightVersion.HIDE}
            content={
                spotlightVersion === SaveForLaterSpotlightVersion.UPSELL ? (
                    <UspellContent />
                ) : (
                    c('Spotlight')
                        .t`A link to this item has been saved in your drive. You can access it later in the 'Shared with me' section.`
                )
            }
            originalPlacement="bottom-end"
        >
            {children}
        </Spotlight>
    );
};
