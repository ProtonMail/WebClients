import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
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
 *
 * The rows wear `@proton/styles`' `checkbox-*` classes, which draw the box that the global form reset
 * expects. They are used directly rather than via `@proton/components`' `Checkbox`, which this package
 * cannot import — `@proton/components` already depends on it.
 */
const ItemCheckList = ({ items, selectedIds, onToggle, disabled, className }: Props) => (
    <div className={clsx('lumo-check-list flex flex-column flex-nowrap gap-1', className)}>
        {items.map(({ id, label }) => (
            <label key={id} className="lumo-check-list__item flex flex-row flex-nowrap items-start gap-2">
                <span className="checkbox-container relative mt-0.5 shrink-0">
                    <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={selectedIds.includes(id)}
                        disabled={disabled}
                        onChange={(event) => onToggle(id, event.target.checked)}
                    />
                    <span className="checkbox-fakecheck">
                        <IcCheckmark className="checkbox-fakecheck-img" size={4} />
                    </span>
                </span>
                <span className="text-sm text-ellipsis-two-lines" title={label}>
                    {label}
                </span>
            </label>
        ))}
    </div>
);

export default ItemCheckList;
