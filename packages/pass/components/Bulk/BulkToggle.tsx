import { type FC, useEffect } from 'react';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { Button } from '@proton/atoms/Button';
import { Icon, Tooltip } from '@proton/components';
import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { metaKey } from '@proton/shared/lib/helpers/browser';

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
            title={<Kbd shortcut={metaKey} />}
        >
            <Button
                shape="solid"
                size="small"
                color="weak"
                onClick={bulk[bulk.enabled ? 'disable' : 'enable']}
                title={c('Action').t`Bulk select items`}
                disabled={disabled}
                className="flex flex-nowrap gap-2 grow-0 text-sm text-semibold max-w-1/3"
            >
                {bulk.enabled ? (
                    c('Action').t`Cancel`
                ) : (
                    <>
                        <Icon name="checkmark-triple" className="shrink-0" />
                        <span className="text-ellipsis hidden xl:block">{c('Action').t`Multiple select`}</span>
                    </>
                )}
            </Button>
        </Tooltip>
    );
};
