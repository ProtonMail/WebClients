import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import { Disclosure } from '@proton/lumo-ui';
import type { IconComponent } from '@proton/lumo-ui/types';
import clsx from '@proton/utils/clsx';

import type { ActionRequest, ReferenceLabels } from '../contracts/types';
import sentenceText from './sentenceText';
import type { CardRenderer } from './types';
import { ConfirmStatus } from './types';

/** `PENDING` is absent: the panel pins that one as an editable card instead of a row. */
type TileStatus = Exclude<ConfirmStatus, ConfirmStatus.PENDING>;

/** A further status fails to compile until it is given a mark of its own. */
const STATUS_MARKS: Record<TileStatus, { Icon: IconComponent; className: string }> = {
    [ConfirmStatus.APPLYING]: { Icon: IcHourglass, className: 'color-weak' },
    [ConfirmStatus.APPLIED]: { Icon: IcCheckmarkCircle, className: 'color-success' },
    [ConfirmStatus.FAILED]: { Icon: IcExclamationCircle, className: 'color-danger' },
    [ConfirmStatus.CANCELLED]: { Icon: IcCrossCircle, className: 'color-weak' },
};

interface Props {
    renderer: CardRenderer;
    action: ActionRequest;
    labels: ReferenceLabels;
    status: TileStatus;
    className?: string;
}

/**
 * A confirmed mutation as one row in the assistant's column. A renderer with no `detail` gets the row
 * without the `<details>` wrapper, so a chevron never invites the user to expand nothing.
 */
const ResultTile = ({ renderer, action, labels, status, className }: Props) => {
    const { Icon: StatusIcon, className: statusClassName } = STATUS_MARKS[status];
    const TypeIcon = renderer.icon;
    // The tile's line clips, and a `title` attribute cannot hold a node, so the card's sentence is read
    // back as plain text. The action here is the one that ran, so the tense is the only difference.
    const title = sentenceText(renderer.sentence(action, labels));
    const detail = renderer.detail?.(action, labels);

    // Both glyphs lead the disclosure's own trigger line, so the status mark stays beside the title when
    // the detail is expanded instead of centring against the taller open block.
    const marks = (
        <>
            <StatusIcon className={clsx('shrink-0', statusClassName)} size={3} />
            <TypeIcon className="shrink-0" size={3} />
        </>
    );

    return (
        <div className={clsx('lumo-agent-result-tile', className, `is-${status}`)}>
            {detail ? (
                <Disclosure label={title} leading={marks} className="flex-1">
                    <p className="m-0 mt-1 text-sm color-weak">{detail}</p>
                </Disclosure>
            ) : (
                <>
                    {marks}
                    <span className="flex-1 text-ellipsis text-sm" title={title}>
                        {title}
                    </span>
                </>
            )}
        </div>
    );
};

export default ResultTile;
