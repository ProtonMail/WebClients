import clsx from '@proton/utils/clsx';

export interface CheckListItem {
    id: string;
    label: string;
}

interface Props {
    items: CheckListItem[];
    /** The ids currently selected; anything not listed renders unchecked. */
    selectedIds: string[];
    onToggle: (id: string, checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

/**
 * A scrollable list of labelled checkboxes — the shared body of any confirm card that lets the user
 * pick which items an action applies to (move, label, star…). Pure presentation: selection state and
 * the toggle handler are supplied by the host.
 */
const ItemCheckList = ({ items, selectedIds, onToggle, disabled, className }: Props) => (
    <div className={clsx('lumo-check-list flex flex-column flex-nowrap gap-1', className)}>
        {items.map(({ id, label }) => (
            <label key={id} className="lumo-check-list__item flex flex-row flex-nowrap items-start gap-2">
                <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={selectedIds.includes(id)}
                    disabled={disabled}
                    onChange={(event) => onToggle(id, event.target.checked)}
                />
                <span className="text-sm text-ellipsis-two-lines" title={label}>
                    {label}
                </span>
            </label>
        ))}
    </div>
);

export default ItemCheckList;
