import Checkbox from '@proton/components/components/input/Checkbox';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';

import type { GatewayGroup } from '../gateways/GatewayGroup';
import type { GatewayUser } from '../gateways/GatewayUser';

interface AddEntitiesTableRowProps {
    id: string | number;
    checked: boolean;
    onSelectEntity: ((entity: GatewayUser) => void) | ((entity: GatewayGroup) => void);
    entity: GatewayUser | GatewayGroup;
    avatar: React.ReactNode;
    description: React.ReactNode;
}

const EntityTableRow = ({ id, checked, onSelectEntity, entity, avatar, description }: AddEntitiesTableRowProps) => (
    <TableRow key={id}>
        <TableCell>
            <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full">
                <Checkbox
                    id={`user-${id}`}
                    checked={checked}
                    onChange={() => {
                        onSelectEntity(entity as any);
                    }}
                />
                <span
                    className="my-auto text-sm rounded border p-1 inline-block relative flex shrink-0 user-initials"
                    aria-hidden="true"
                >
                    <span className="m-auto">{avatar}</span>
                </span>
                <div className="flex flex-column text-left">
                    <span>{entity.Name}</span>
                    <span className="text-sm color-weak">{description}</span>
                </div>
            </div>
        </TableCell>
    </TableRow>
);
export default EntityTableRow;
