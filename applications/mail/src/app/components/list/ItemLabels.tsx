import React from 'react';
import { toMap } from 'proton-shared/lib/helpers/object';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { noop } from 'proton-shared/lib/helpers/function';
import { Link } from 'react-router-dom';
import { Icon, classnames } from 'react-components';

import { c } from 'ttag';
import { Label } from '../../models/label';
import { Element } from '../../models/element';
import { getLabelIDs } from '../../helpers/elements';
import { getLabelsWithoutFolders } from '../../helpers/labels';

interface Props {
    element?: Element;
    labels?: Label[];
    max?: number;
    onUnlabel?: (labelID: string) => void;
    className?: string;
}

const ItemLabels = ({ element = {}, onUnlabel = noop, max = 99, labels = [], className = '' }: Props) => {
    const labelIDs = getLabelIDs(element) || [];
    const labelsMap = toMap(getLabelsWithoutFolders(labels)) as { [labelID: string]: Label };
    const labelsObjects: Label[] = labelIDs.map((ID) => labelsMap[ID]).filter(Boolean);
    const labelsSorted: Label[] = orderBy(labelsObjects, 'Order');
    const labelsToShow = labelsSorted.slice(0, max);

    return (
        <div
            className={classnames([
                'inline-flex flew-row flex-items-center pm-badgeLabel-container stop-propagation',
                className
            ])}
        >
            {labelsToShow.map(({ ID = '', Name = '', Color = '' }) => (
                <span
                    className="badgeLabel flex flex-row flex-items-center ml0-25"
                    style={{
                        backgroundColor: Color,
                        borderColor: Color
                    }}
                    key={ID}
                >
                    <Link
                        to={`/${ID}`}
                        className="pm-badgeLabel-link color-white nodecoration"
                        title={c('Action').t`Display emails labelled with ${Name}`}
                    >
                        {Name}
                    </Link>
                    {onUnlabel !== noop ? (
                        <button
                            type="button"
                            className="flex pm-badgeLabel-button flex-item-noshrink"
                            onClick={() => onUnlabel(ID)}
                            title={c('Action').t`Remove this label`}
                        >
                            <Icon name="off" size={12} color="white" />
                            <span className="sr-only">{c('Action').t`Remove this label`}</span>
                        </button>
                    ) : null}
                </span>
            ))}
        </div>
    );
};

export default ItemLabels;
