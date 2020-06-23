import React, { MouseEvent } from 'react';
import { c } from 'ttag';
import { Icon, useLoading, classnames } from 'react-components';

import { Element } from '../../models/element';
import { isMessage as testIsMessage, isStarred as testIsStarred } from '../../helpers/elements';
import { useStar } from '../../hooks/useApplyLabels';

interface Props {
    element?: Element;
}

const ItemStar = ({ element = {} }: Props) => {
    const [loading, withLoading] = useLoading();
    const star = useStar();

    const isMessage = testIsMessage(element);
    const isStarred = testIsStarred(element);

    const handleClick = async (event: MouseEvent) => {
        event.stopPropagation();
        withLoading(star(isMessage, [element.ID || ''], !isStarred));
    };

    return (
        <button
            disabled={loading}
            type="button"
            className={classnames([
                'starbutton relative item-star inline-flex stop-propagation',
                isStarred && 'starbutton--is-starred'
            ])}
            onClick={handleClick}
        >
            <Icon name="star" className="starbutton-icon-star" />
            <Icon name="starfull" className="starbutton-icon-starred" />
            <span className="sr-only">{isStarred ? c('Alt').t`Unstar element` : c('Alt').t`Star element`}</span>
        </button>
    );
};

export default ItemStar;
