import ItemCheckList from '../primitives/ItemCheckList';
import type { CheckListItem } from '../primitives/ItemCheckList';

interface Props {
    /** The items an action can apply to (e.g. emails to move), by stable id + human label. */
    items: CheckListItem[];
    /** Which items are currently included; the user can deselect any before applying. */
    selectedIds: string[];
    onToggle: (id: string, checked: boolean) => void;
    disabled?: boolean;
}

/**
 * Shared confirm-card body for "apply this action to N items" (move, label, star, snooze…): a
 * scrollable, deselectable list of the affected items. The action's target (destination folder, label)
 * belongs in the shell's subtitle, so this body is just the item selection — reusable across products.
 */
const MoveItemsCard = ({ items, selectedIds, onToggle, disabled }: Props) => (
    <ItemCheckList
        className="lumo-confirm-card__targets"
        items={items}
        selectedIds={selectedIds}
        onToggle={onToggle}
        disabled={disabled}
    />
);

export default MoveItemsCard;
