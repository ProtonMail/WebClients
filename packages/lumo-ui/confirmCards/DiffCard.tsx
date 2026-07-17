import { c } from 'ttag';

interface Props {
    /** The current value being replaced. */
    before: string;
    /** The proposed new value. */
    after: string;
    beforeLabel?: string;
    afterLabel?: string;
}

/**
 * Shared confirm-card body for a "change this text from X to Y" action (signature, away message,
 * folder rename…): a stacked before/after view so the user sees exactly what changes. Reusable across
 * products; the host supplies the two values and, optionally, the row labels.
 */
const DiffCard = ({ before, after, beforeLabel, afterLabel }: Props) => (
    <div className="lumo-diff flex flex-column flex-nowrap gap-2">
        <div className="lumo-diff__row lumo-diff__row--before">
            <span className="lumo-diff__label block text-xs color-weak">{beforeLabel ?? c('Label').t`Before`}</span>
            <span className="lumo-diff__value block text-sm">{before}</span>
        </div>
        <div className="lumo-diff__row lumo-diff__row--after">
            <span className="lumo-diff__label block text-xs color-weak">{afterLabel ?? c('Label').t`After`}</span>
            <span className="lumo-diff__value block text-sm">{after}</span>
        </div>
    </div>
);

export default DiffCard;
