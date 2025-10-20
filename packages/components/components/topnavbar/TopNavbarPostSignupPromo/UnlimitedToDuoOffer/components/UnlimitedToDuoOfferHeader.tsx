import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

export const UnlimitedToDuoOfferHeader = () => {
    return (
        <header>
            <h2 className="text-center text-xl text-bold">{c('Title')
                .t`Double your storage with ${BRAND_NAME} Duo`}</h2>
        </header>
    );
};
