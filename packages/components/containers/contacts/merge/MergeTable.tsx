import React from 'react';
import { c } from 'ttag';
import { ContactFormatted } from 'proton-shared/lib/interfaces/contacts';

import { Block, OrderableTable, TableCell, Button } from '../../../components';
import MergeTableBody from './MergeTableBody';
import '../../../components/orderableTable/OrderableTableHeader.scss';

const MergeTableHeader = () => {
    return (
        <thead className="orderableTableHeader">
            <tr>
                <TableCell type="header"> </TableCell>
                <TableCell type="header">{c('TableHeader').t`Name`}</TableCell>
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
                    <Block key={`${group && group[0].Name}`} className="mb2 flex flex-column flex-align-items-center">
                        <OrderableTable onSortEnd={onSortEnd(i)} className="mb1">
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
                        >
                            {c('Action').t`Preview contact`}
                        </Button>
                    </Block>
                );
            })}
        </>
    );
};

export default MergeTable;
