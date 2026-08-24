import { memo, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { metaKey } from '@proton/shared/lib/helpers/browser';

import { DropdownMenuButton } from '../Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '../Layout/Dropdown/QuickActionsDropdown';
import { useBulkActions } from './BulkSelectionActions';
import { useBulkEnabled } from './BulkSelectionState';

type Props = { disabled?: boolean };

export const BulkToggle = memo(({ disabled }: Props) => {
    const bulk = useBulkActions();
    const bulkEnabled = useBulkEnabled();

    useEffect(() => {
        if (disabled) bulk.disable();
    }, [disabled]);

    if (bulkEnabled) {
        return (
            <Button
                shape="solid"
                size="small"
                color="weak"
                onClick={bulk.disable}
                title={c('Action').t`Cancel bulk selection`}
                className="flex flex-nowrap gap-2 grow-0 shrink-0 text-sm text-semibold"
            >
                {c('Action').t`Cancel`}
            </Button>
        );
    }

    return (
        <Tooltip key="bulk-toggle" openDelay={500} originalPlacement="bottom" title={<Kbd shortcut={metaKey} />}>
            <span className="inline-flex shrink-0">
                <QuickActionsDropdown
                    disabled={disabled}
                    iconSize={4}
                    originalPlacement="bottom-end"
                    pill
                    shape="ghost"
                    size="small"
                >
                    <DropdownMenuButton
                        onClick={() => bulk.enable()}
                        label={c('Action').t`Select items`}
                        icon="checkmark-triple"
                        size="small"
                    />
                </QuickActionsDropdown>
            </span>
        </Tooltip>
    );
});

BulkToggle.displayName = 'BulkToggleMemo';
