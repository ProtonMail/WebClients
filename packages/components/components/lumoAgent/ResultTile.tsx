import { c } from 'ttag';

import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle';
import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';
import { Disclosure } from '@proton/lumo-ui';
import clsx from '@proton/utils/clsx';

import type { CardRenderer } from './types';

interface Props {
    renderer: CardRenderer;
    action: ActionRequest;
    labels: Record<string, string>;
    status: 'applied' | 'cancelled';
}

/** A settled mutation: the renderer's type icon + title, a status icon, and the optional detail line. */
const ResultTile = ({ renderer, action, labels, status }: Props) => {
    const Icon = renderer.icon;
    const StatusIcon = status === 'applied' ? IcCheckmarkCircle : IcCrossCircle;
    const detail = renderer.detail?.(action, labels);

    return (
        <div className={clsx('lumo-agent-result-tile', `is-${status}`)}>
            <Icon className="lumo-agent-result-tile-icon" />
            <span className="lumo-agent-result-tile-title text-ellipsis">{renderer.title(action, labels)}</span>
            <StatusIcon className="lumo-agent-result-tile-status" />
            {detail ? <Disclosure label={c('Info').t`Details`}>{detail}</Disclosure> : null}
        </div>
    );
};

export default ResultTile;
