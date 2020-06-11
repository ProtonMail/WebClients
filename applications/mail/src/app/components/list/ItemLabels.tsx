import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, classnames } from 'react-components';
import { toMap } from 'proton-shared/lib/helpers/object';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { Label } from 'proton-shared/lib/interfaces/Label';

import { c } from 'ttag';
import { Element } from '../../models/element';
import { getLabelIDs, isMessage } from '../../helpers/elements';
import { useApplyLabels } from '../../hooks/useApplyLabels';

interface Props {
    element?: Element;
    labels?: Label[];
    max?: number;
    showUnlabel?: boolean;
    className?: string;
    isCollapsed?: boolean;
}

const ItemLabels = ({
    element = {},
    showUnlabel = false,
    max = 99,
    labels = [],
    className = '',
    isCollapsed = true
}: Props) => {
    const applyLabels = useApplyLabels();

    const labelIDs = getLabelIDs(element) || [];
    const labelsMap = toMap(labels);
    const labelsObjects = labelIDs.map((ID) => labelsMap[ID]).filter(isTruthy);
    const labelsSorted = orderBy(labelsObjects, 'Order') as Label[];
    const labelsToShow = labelsSorted.slice(0, max);

    const handleUnlabel = (labelID: string) =>
        applyLabels(isMessage(element), [element.ID || ''], { [labelID]: false });

    return (
        <div
            className={classnames([
                'inline-flex flew-row flex-items-center pm-badgeLabel-container stop-propagation',
                isCollapsed && 'pm-badgeLabel-container--collapsed',
                className
            ])}
            role="list"
        >
            {labelsToShow.map(({ ID = '', Name = '', Color = '' }) => (
                <span
                    className="badgeLabel flex flex-row flex-items-center"
                    style={{
                        color: Color
                    }}
                    key={ID}
                    role="listitem"
                >
                    <Link
                        to={`/${ID}`}
                        className="pm-badgeLabel-link ellipsis color-white nodecoration"
                        title={c('Action').t`Display emails labelled with ${Name}`}
                    >
                        {Name}
                    </Link>
                    {showUnlabel && (
                        <button
                            type="button"
                            className="flex pm-badgeLabel-button flex-item-noshrink"
                            onClick={() => handleUnlabel(ID)}
                            title={c('Action').t`Remove this label`}
                        >
                            <Icon name="off" size={11} color="white" />
                            <span className="sr-only">{c('Action').t`Remove this label`}</span>
                        </button>
                    )}
                </span>
            ))}
        </div>
    );
};

export default ItemLabels;
