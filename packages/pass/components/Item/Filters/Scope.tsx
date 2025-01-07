import { memo } from 'react';

import type { IconName } from '@proton/components';
import { DropdownButton, Icon } from '@proton/components';

type Props = {
    icon: IconName;
    label: string;
    count: number;
};

export const ScopeFilter = memo(({ label, count, icon }: Props) => {
    return (
        <DropdownButton
            color="weak"
            shape="solid"
            size="small"
            className="flex flex-nowrap gap-2 grow-0 text-sm text-semibold pointer-events-none"
        >
            <Icon name={icon} className="shrink-0" />
            <span className="text-ellipsis hidden sm:block">
                {label} ({count})
            </span>
        </DropdownButton>
    );
});

ScopeFilter.displayName = 'ScopeFilterMemo';
