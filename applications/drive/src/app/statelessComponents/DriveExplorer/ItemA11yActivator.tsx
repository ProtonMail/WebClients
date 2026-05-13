import './ItemA11yActivator.scss';

interface ItemA11yActivatorProps {
    ariaLabel: string;
    isSelected: boolean;
    onMouseDown: (event: React.MouseEvent) => void;
    onClick: (event: React.MouseEvent) => void;
    onDoubleClick: (event: React.MouseEvent) => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
    onContextMenu: (event: React.MouseEvent) => void;
}

// Always-present invisible <button> that provides keyboard and pointer
// activation for an item (list row or grid card). Positioned absolutely to
// fill its container; interactive children lift above it via
// `position: relative` so checkboxes, icons, and context-menu buttons keep
// their own click targets.
//
// Why this pattern exists: the natural shortcut would be to slap onClick +
// tabIndex on the <tr> / <div> container, but that's broken accessibility on
// two counts:
//   1. A non-button element with click handlers is unannounced as
//      interactive by assistive tech (no implicit role, no keyboard
//      activation, no focus ring) and triggers `jsx-a11y/no-static-element-interactions`.
//      Wrapping the container itself in a <button> would in turn make every
//      cell button (share icon, checkbox, context-menu button) a nested
//      interactive element, which is invalid HTML and confuses both AT
//      announcements and pointer-event delegation.
//   2. Modals or popovers rendered inside a clickable row container have
//      their events bubble back to the row's handler through React's
//      synthetic event tree (even when portalled), forcing fragile
//      `stopPropagation` band-aids on every event type.
//
// Splitting the activator out as a sibling button keeps the row a passive
// container, the cell buttons remain top-level interactive elements, and the
// activator is the single focusable target announced to AT for the whole
// item.
export const ItemA11yActivator = ({
    ariaLabel,
    isSelected,
    onMouseDown,
    onClick,
    onDoubleClick,
    onKeyDown,
    onContextMenu,
}: ItemA11yActivatorProps) => (
    <button
        type="button"
        className="item-a11y-activator absolute inset-0 z-1"
        style={{ background: 'transparent', border: 0, padding: 0, cursor: 'default' }}
        aria-label={ariaLabel}
        aria-pressed={isSelected}
        data-testid="item-a11y-activator"
        onMouseDown={onMouseDown}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
        onContextMenu={onContextMenu}
    />
);

export const ItemA11yActivatorCell = (props: ItemA11yActivatorProps) => (
    <td className="item-a11y-activator-cell absolute inset-0 p-0 border-0">
        <ItemA11yActivator {...props} />
    </td>
);
