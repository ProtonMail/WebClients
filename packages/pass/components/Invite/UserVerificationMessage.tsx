import { type VFC } from 'react';

import { c } from 'ttag';

import { ItemCard } from '../Item/ItemCard';

export const UserVerificationMessage: VFC = () => {
    return (
        <ItemCard className="mb-2">
            {c('Warning').t`Please verify your email address in order to use vault sharing`}
        </ItemCard>
    );
};
