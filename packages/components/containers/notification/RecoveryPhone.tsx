import React from 'react';
import { c } from 'ttag';

import { PrimaryButton, Field } from '../../components';

interface Props {
    phone: string | null;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const RecoveryPhone = ({ phone, onClick }: Props) => {
    return (
        <>
            <Field>
                <div className="text-ellipsis" title={phone || ''}>
                    {phone || c('Info').t`Not set`}
                </div>
            </Field>
            <div className="ml1 on-mobile-ml0">
                <PrimaryButton onClick={onClick}>{c('Action').t`Edit`}</PrimaryButton>
            </div>
        </>
    );
};

export default RecoveryPhone;
