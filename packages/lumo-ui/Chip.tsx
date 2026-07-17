import Disclosure from './primitives/Disclosure';

interface Props {
    /** The one-line trigger, e.g. the name of the tool or payload being disclosed. */
    label: string;
    /** The exact text revealed when expanded, shown verbatim in a scrolling monospace box. */
    payload: string;
    className?: string;
}

/**
 * A transparency chip: a compact one-line trigger revealing an exact payload (e.g. the arguments sent
 * to a tool) in a monospace box that scrolls within itself, so a long line can never widen its host.
 */
const Chip = ({ label, payload, className }: Props) => (
    <Disclosure label={label} className={className}>
        <pre className="lumo-chip__payload text-sm">{payload}</pre>
    </Disclosure>
);

export default Chip;
