import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';

export const BulkToggle: FC = () => {
    const bulk = useBulkSelect();

    return (
        <Button
            shape="solid"
            size="small"
            color="weak"
            icon={!bulk.isBulk}
            onClick={bulk[bulk.isBulk ? 'disable' : 'enable']}
            title={c('Action').t`Bulk select items`}
        >
            {bulk.isBulk ? c('Action').t`Cancel` : <Icon name={'checkmark-triple'} />}
        </Button>
    );
};
