import { type FC, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';

type Props = { disabled?: boolean };

export const BulkToggle: FC<Props> = ({ disabled }) => {
    const bulk = useBulkSelect();

    useEffect(() => {
        if (disabled) bulk.disable();
    }, [disabled]);

    return (
        <Button
            shape="solid"
            size="small"
            color="weak"
            icon={!bulk.enabled}
            onClick={bulk[bulk.enabled ? 'disable' : 'enable']}
            title={c('Action').t`Bulk select items`}
            disabled={disabled}
        >
            {bulk.enabled ? c('Action').t`Cancel` : <Icon name={'checkmark-triple'} />}
        </Button>
    );
};
