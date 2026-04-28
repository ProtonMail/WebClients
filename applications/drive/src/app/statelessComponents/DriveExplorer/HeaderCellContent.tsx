import { InfoIconTooltip } from '@proton/drive/components/InfoIconTooltip';
import { getNumAccessesTooltipMessage } from '@proton/shared/lib/drive/translations';

import { SortField } from '../../modules/sorting/types';

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
            {currentSortField === SortField.numberOfInitializedDownloads &&
                cellSortField === SortField.numberOfInitializedDownloads && (
                    <InfoIconTooltip title={numAccessesTooltipMessage} className="pl-1" />
                )}
        </>
    );
}
