import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import clsx from '@proton/utils/clsx';

export interface CheckListItem {
    id: string;
    /** The row's first line, and its `title` — so a clipped label stays recoverable (Mail CLAUDE.md §15). */
    label: string;
    /** A second line beneath the label (an email's subject under its sender). */
    subtitle?: string;
    /** A short trailing value on the label's line (a date), already formatted for display. */
    meta?: string;
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
 * The checkbox occupies the same lead column as {@link ConfirmCardShell}'s glyph, so every row's label
 * starts on the same vertical line as the card's sentence. A deselected row dims as well as losing its
 * tick: the tick alone is too quiet to read as "this one is out of the set".
 *
 * The rows wear `@proton/styles`' `checkbox-*` classes, which draw the box that the global form reset
 * expects. They are used directly rather than via `@proton/components`' `Checkbox`, which this package
 * cannot import — `@proton/components` already depends on it.
 */
const ItemCheckList = ({ items, selectedIds, onToggle, disabled, className }: Props) => (
    <div className={clsx('lumo-check-list flex flex-column flex-nowrap', className)}>
        {items.map(({ id, label, subtitle, meta }) => {
            const selected = selectedIds.includes(id);

            return (
                <label
                    key={id}
                    className={clsx(
                        'lumo-check-list__item flex flex-row flex-nowrap items-center gap-2',
                        !selected && 'lumo-check-list__item--deselected'
                    )}
                >
                    <span className="checkbox-container relative shrink-0">
                        <input
                            type="checkbox"
                            className="checkbox-input"
                            checked={selected}
                            disabled={disabled}
                            onChange={(event) => onToggle(id, event.target.checked)}
                        />
                        <span className="checkbox-fakecheck">
                            <IcCheckmark className="checkbox-fakecheck-img" size={4} />
                        </span>
                    </span>
                    <span className="flex flex-column flex-nowrap flex-1 min-w-0">
                        <span className="flex flex-row flex-nowrap gap-2">
                            <span className="flex-1 text-sm text-semibold text-ellipsis" title={label}>
                                {label}
                            </span>
                            {meta && <span className="shrink-0 text-xs color-weak">{meta}</span>}
                        </span>
                        {subtitle && (
                            <span className="text-sm color-weak text-ellipsis" title={subtitle}>
                                {subtitle}
                            </span>
                        )}
                    </span>
                </label>
            );
        })}
    </div>
);

export default ItemCheckList;
