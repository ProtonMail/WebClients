import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
}

/**
 * A slim, indeterminate loading bar — purely decorative chrome a host can show while a request is in
 * flight. It carries no ARIA role: the accessible "busy" signal belongs to the status text a host
 * pairs it with (e.g. {@link LumoThinking}'s label), so the bar is hidden from assistive tech to avoid
 * a redundant, value-less progressbar. The animation is CSS-only (see `lumo-ui.scss`) and disables
 * under `prefers-reduced-motion`.
 */
const LoadingBar = ({ className }: Props) => (
    <div className={clsx('lumo-loading-bar', className)} aria-hidden="true">
        <span className="lumo-loading-bar__indicator" />
    </div>
);

export default LoadingBar;
