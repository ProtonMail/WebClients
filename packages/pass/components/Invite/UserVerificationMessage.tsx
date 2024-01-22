import { type FC } from 'react';

import { c } from 'ttag';

import { Card } from '../Layout/Card/Card';

export const UserVerificationMessage: FC = () => {
    return (
        <Card className="mb-2">{c('Warning').t`Please verify your email address in order to use vault sharing`}</Card>
    );
};
