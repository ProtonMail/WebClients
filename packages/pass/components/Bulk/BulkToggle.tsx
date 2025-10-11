import { memo, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';
import { useBulkActions } from '@proton/pass/components/Bulk/BulkSelectionActions';
import { useBulkEnabled } from '@proton/pass/components/Bulk/BulkSelectionState';
import { metaKey } from '@proton/shared/lib/helpers/browser';

type Props = { disabled?: boolean };

export const BulkToggle = memo(({ disabled }: Props) => {
    const bulk = useBulkActions();
    const bulkEnabled = useBulkEnabled();

    useEffect(() => {
        if (disabled) bulk.disable();
    }, [disabled]);

    return (
        <Tooltip
            key="bulk-toggle"
            openDelay={500}
            isOpen={bulkEnabled ? false : undefined}
            originalPlacement={'bottom'}
            title={<Kbd shortcut={metaKey} />}
        >
            <Button
                shape="solid"
                size="small"
                color="weak"
                onClick={bulk[bulkEnabled ? 'disable' : 'enable']}
                title={c('Action').t`Bulk select items`}
                disabled={disabled}
                className="flex flex-nowrap gap-2 grow-0 text-sm text-semibold max-w-1/3"
            >
                {bulkEnabled ? (
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
});

BulkToggle.displayName = 'BulkToggleMemo';
