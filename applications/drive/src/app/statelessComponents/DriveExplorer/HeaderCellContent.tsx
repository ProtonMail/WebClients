import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components';
import { getNumAccessesTooltipMessage } from '@proton/shared/lib/drive/translations';

import { SortField } from '../../hooks/util/useSorting';

interface HeaderCellContentProps {
    headerText?: string;
    currentSortField?: SortField;
    cellSortField?: SortField;
}

export function HeaderCellContent({ headerText, currentSortField, cellSortField }: HeaderCellContentProps) {
    const numAccessesTooltipMessage = getNumAccessesTooltipMessage();
    return (
        <>
            {headerText}
            {currentSortField === SortField.numAccesses && cellSortField === SortField.numAccesses && (
                <Tooltip className="pl-1" title={numAccessesTooltipMessage}>
                    <Icon name="info-circle" size={3.5} alt={numAccessesTooltipMessage} />
                </Tooltip>
            )}
        </>
    );
}
