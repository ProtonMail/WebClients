import { FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { Exporter } from '../../../shared/components/export';

export const Export: FC = () => {
    return (
        <>
            <Card rounded className="mb-4 p-3 relative">
                <strong className="color-norm block">{c('Label').t`Export`}</strong>
                <em className="block text-sm color-weak mt-1">
                    {c('Info')
                        .t`To securely export your ${PASS_APP_NAME} data, please choose a strong password. ${PASS_APP_NAME} exports use PGP encryption : if you lose your passphrase, you will not be able to access your exported data.`}
                </em>

                <hr className="mt-2 mb-4 border-weak" />
                <Exporter />
            </Card>
        </>
    );
};
