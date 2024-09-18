import { c } from 'ttag';

import { Button } from '@proton/atoms';
import TableCell from '@proton/components/components/table/TableCell';
import type { ContactFormatted } from '@proton/shared/lib/interfaces/contacts';

import { OrderableTable } from '../../../../components';
import MergeTableBody from './MergeTableBody';

import '../../../../components/orderableTable/OrderableTableHeader.scss';

const MergeTableHeader = () => {
    return (
        <thead className="orderableTableHeader">
            <tr>
                <TableCell type="header"> </TableCell>
                <TableCell type="header">{c('TableHeader').t`Display name`}</TableCell>
                <TableCell type="header" className="w-1/6">{c('TableHeader').t`First name`}</TableCell>
                <TableCell type="header" className="w-1/6">{c('TableHeader').t`Last name`}</TableCell>
                <TableCell type="header">{c('TableHeader').t`Address`}</TableCell>
                <TableCell type="header">{c('TableHeader').t`Actions`}</TableCell>
            </tr>
        </thead>
    );
};

interface Props {
    contacts: ContactFormatted[][];
    isChecked: { [ID: string]: boolean };
    beDeleted: { [ID: string]: boolean };
    onClickCheckbox: (ID: string) => void;
    onClickDetails: (ID: string) => void;
    onToggleDelete: (ID: string) => void;
    onClickPreview: (beMergedID: string, beDeletedIDs: string[]) => void;
    onSortEnd: (groupIndex: number) => ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => void;
}

const MergeTable = ({
    contacts = [],
    isChecked = {},
    beDeleted = {},
    onClickCheckbox,
    onClickDetails,
    onToggleDelete,
    onClickPreview,
    onSortEnd,
}: Props) => {
    return (
        <>
            {contacts.map((group, i) => {
                const activeIDs = group
                    .map(({ ID }) => isChecked[ID] && !beDeleted[ID] && ID)
                    .filter(Boolean) as string[];
                const beDeletedIDs = group.map(({ ID }) => beDeleted[ID] && ID).filter(Boolean) as string[];
                const beMergedIDs = activeIDs.length > 1 ? activeIDs : [];

                return (
                    <div key={`${group && group[0].Name}`} className="mb-8 flex flex-column items-center">
                        <OrderableTable
                            onSortEnd={onSortEnd(i)}
                            className="mb-4"
                            helperClass="z-modals bg-norm color-norm"
                        >
                            <MergeTableHeader />
                            <MergeTableBody
                                contacts={group}
                                highlightedID={beMergedIDs[0]}
                                isChecked={isChecked}
                                beDeleted={beDeleted}
                                onClickCheckbox={onClickCheckbox}
                                onClickDetails={onClickDetails}
                                onToggleDelete={onToggleDelete}
                            />
                        </OrderableTable>
                        <Button
                            className="aligcenter"
                            disabled={!beMergedIDs.length}
                            type="button"
                            onClick={() => onClickPreview(beMergedIDs[0], beDeletedIDs)}
                            data-testid="merge-model:preview-contact-button"
                        >
                            {c('Action').t`Preview contact`}
                        </Button>
                    </div>
                );
            })}
        </>
    );
};

export default MergeTable;
