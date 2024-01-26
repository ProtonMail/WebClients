import { type FC, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Kbd } from '@proton/atoms/Kbd';
import { Icon, Tooltip } from '@proton/components';
import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { shiftKey } from '@proton/shared/lib/helpers/browser';

type Props = { disabled?: boolean };

export const BulkToggle: FC<Props> = ({ disabled }) => {
    const bulk = useBulkSelect();

    useEffect(() => {
        if (disabled) bulk.disable();
    }, [disabled]);

    return (
        <Tooltip
            key="bulk-toggle"
            openDelay={500}
            isOpen={bulk.enabled ? false : undefined}
            originalPlacement={'bottom'}
            title={<Kbd shortcut={shiftKey} />}
        >
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
        </Tooltip>
    );
};
