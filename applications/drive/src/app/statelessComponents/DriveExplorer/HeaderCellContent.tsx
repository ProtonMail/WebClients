import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
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
                    <Tooltip className="pl-1" title={numAccessesTooltipMessage}>
                        <IcInfoCircle size={3.5} alt={numAccessesTooltipMessage} />
                    </Tooltip>
                )}
        </>
    );
}
