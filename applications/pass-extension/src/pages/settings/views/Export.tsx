import type { FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';

import { Exporter } from '../../../shared/components/export';

export const Export: FC = () => {
    return (
        <>
            <Card rounded className="mb-4 p-3 relative">
                <strong className="color-norm block">{c('Label').t`Export`}</strong>
                <hr className="mt-2 mb-4 border-weak" />
                <Exporter />
            </Card>
        </>
    );
};
