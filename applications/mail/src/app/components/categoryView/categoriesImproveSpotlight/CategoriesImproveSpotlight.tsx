import type { ReactElement } from 'react';

import { c } from 'ttag';

import Spotlight from '@proton/components/components/spotlight/Spotlight';

interface Props {
    show: boolean;
    onDisplayed: () => void;
    onClose: () => void;
    children: ReactElement;
}

export const CategoriesImproveSpotlight = ({ show, onDisplayed, onClose, children }: Props) => {
    return (
        <Spotlight
            show={show}
            onDisplayed={onDisplayed}
            onClose={onClose}
            borderRadius="xl"
            innerClassName="p-6"
            content={
                <div>
                    <h2 className="mb-1 text-rg text-bold">{c('Title').t`Make Categories work better for you`}</h2>
                    <p className="m-0 text-rg color-weak">{c('Description')
                        .t`Move emails to the right category to improve categorization.`}</p>
                </div>
            }
        >
            {children}
        </Spotlight>
    );
};
