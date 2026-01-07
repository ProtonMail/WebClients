import { c, msgid } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';

import type { GatewayGroup } from '../gateways/GatewayGroup';
import type { GatewayUser } from '../gateways/GatewayUser';

interface TableHeaderProps {
    entities: GatewayUser[] | GatewayGroup[];
    selectedEntities: GatewayUser[] | GatewayGroup[];
    onSelectAllEntities: () => void;
    label: string;
}

const TableHeader = ({ label, entities, selectedEntities, onSelectAllEntities }: TableHeaderProps) => (
    <TableRow>
        <TableCell>
            <div className="flex gap-4 w-full items-center">
                <Checkbox checked={entities.length <= selectedEntities.length} onChange={onSelectAllEntities} />
                <span className="text-bold">{label}</span>
                {selectedEntities.length > 0 && (
                    <span className="text-sm color-weak">
                        {c('Info').ngettext(
                            msgid`${selectedEntities.length} selected`,
                            `${selectedEntities.length} selected`,
                            selectedEntities.length
                        )}
                    </span>
                )}
            </div>
        </TableCell>
    </TableRow>
);
export default TableHeader;
