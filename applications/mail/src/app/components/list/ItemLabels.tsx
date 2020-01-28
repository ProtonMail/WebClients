import React from 'react';
import { toMap } from 'proton-shared/lib/helpers/object';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { Link } from 'react-router-dom';
import { Icon, classnames } from 'react-components';

import { Label } from '../../models/label';
import { getLabelIds } from '../../helpers/elements';
import { Element } from '../../models/element';

interface Props {
    element: Element;
    labels?: Label[];
    max?: number;
    onUnlabel?: (labelID: string) => void;
    className?: string;
}

const ItemLabels = ({ element, onUnlabel, max = 99, labels = [], className = '' }: Props) => {
    const labelIDs = getLabelIds(element);
    const labelsMap: { [labelID: string]: Label } = toMap(labels) as any;

    return (
        <div className={classnames(['inbl', className])}>
            {orderBy(labelIDs.map((ID) => labelsMap[ID]).filter(Boolean), 'Order')
                .slice(0, max)
                .map(({ ID = '', Name = '', Color = '' }) => {
                    const style = {
                        backgroundColor: Color,
                        borderColor: Color
                    };
                    const to = `/${ID}`;
                    return (
                        <span className="badgeLabel" style={style} key={ID}>
                            <Link to={to}>{Name}</Link>
                            {onUnlabel ? (
                                <button type="button" onClick={() => onUnlabel(ID)}>
                                    <Icon name="off" />
                                </button>
                            ) : null}
                        </span>
                    );
                })}
        </div>
    );
};

export default ItemLabels;
