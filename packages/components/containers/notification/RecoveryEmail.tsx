import React from 'react';
import { c } from 'ttag';

import { PrimaryButton, Field } from '../../components';

interface Props {
    email: string | null;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const RecoveryEmail = ({ email, onClick }: Props) => {
    return (
        <>
            <Field>
                <div className="text-ellipsis" title={email || ''}>
                    {email || c('Info').t`Not set`}
                </div>
            </Field>
            <div className="ml1 on-mobile-ml0">
                <PrimaryButton onClick={onClick}>{c('Action').t`Edit`}</PrimaryButton>
            </div>
        </>
    );
};

export default RecoveryEmail;
