import type { CheckListItem } from '../primitives/ItemCheckList';

interface Props {
    /** The items that will be removed, by stable id + human label. */
    items: CheckListItem[];
}

/**
 * Shared confirm-card body for a destructive "delete these N items" action: a plain read-only list of
 * exactly what will be removed. Deletion is all-or-nothing (no per-item deselect) so the user reviews
 * the full set before confirming in the shell. Reusable across products.
 */
const DeleteItemsCard = ({ items }: Props) => (
    <ul className="lumo-confirm-card__delete-list unstyled m-0 flex flex-column flex-nowrap">
        {items.map(({ id, label }) => (
            <li key={id} className="text-sm text-ellipsis" title={label}>
                {label}
            </li>
        ))}
    </ul>
);

export default DeleteItemsCard;
