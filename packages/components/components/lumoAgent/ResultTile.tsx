import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle';
import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';
import { Disclosure } from '@proton/lumo-ui';
import type { IconComponent } from '@proton/lumo-ui/types';
import clsx from '@proton/utils/clsx';

import type { CardRenderer, LumoAgentItem } from './types';

type SettledStatus = Exclude<Extract<LumoAgentItem, { kind: 'confirm' }>['status'], 'pending'>;

/** A further settled status fails to compile until it is given a mark of its own. */
const STATUS_MARKS: Record<SettledStatus, { Icon: IconComponent; className: string }> = {
    applied: { Icon: IcCheckmarkCircle, className: 'color-success' },
    cancelled: { Icon: IcCrossCircle, className: 'color-weak' },
};

interface Props {
    renderer: CardRenderer;
    action: ActionRequest;
    labels: Record<string, string>;
    status: SettledStatus;
    className?: string;
}

/**
 * A settled mutation as one row in the assistant's column. A renderer with no `detail` gets the row
 * without the `<details>` wrapper, so a chevron never invites the user to expand nothing.
 */
const ResultTile = ({ renderer, action, labels, status, className }: Props) => {
    const { Icon: StatusIcon, className: statusClassName } = STATUS_MARKS[status];
    const TypeIcon = renderer.icon;
    const title = renderer.title(action, labels);
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
