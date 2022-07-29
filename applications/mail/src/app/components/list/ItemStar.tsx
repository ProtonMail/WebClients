import { MouseEvent } from 'react';

import { c } from 'ttag';

import { Icon, IconSize, Tooltip, classnames, useLoading, useMailSettings } from '@proton/components';

import { isMessage, isStarred as testIsStarred } from '../../helpers/elements';
import { useStar } from '../../hooks/useApplyLabels';
import { Element } from '../../models/element';

interface Props {
    element?: Element;
    size?: IconSize;
}

const ItemStar = ({ element, size }: Props) => {
    const [loading, withLoading] = useLoading();
    const star = useStar();
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const isStarred = testIsStarred(element || ({} as Element));

    const title = isMessage(element)
        ? isStarred
            ? c('Alt').t`Unstar message`
            : c('Alt').t`Star message`
        : isStarred
        ? c('Alt').t`Unstar conversation`
        : c('Alt').t`Star conversation`;

    const handleClick = async (event: MouseEvent) => {
        event.stopPropagation();
        // Programmatically block the action instead of disabling the action
        // Perhaps a bit less accessible but prevent to collapse a message on a second click
        if (!loading) {
            void withLoading(star([element || ({} as Element)], !isStarred));
        }
    };

    return (
        <Tooltip
            title={
                Shortcuts ? (
                    <>
                        {title}
                        <br />
                        <kbd className="border-none">*</kbd>
                    </>
                ) : (
                    title
                )
            }
        >
            <button
                data-testid={`item-star-${isStarred}`}
                type="button"
                className={classnames([
                    'starbutton relative item-star flex stop-propagation',
                    isStarred && 'starbutton--is-starred',
                ])}
                onClick={handleClick}
            >
                <Icon size={size} name={isStarred ? 'star-filled' : 'star'} className="starbutton-icon-star" />
                <span className="sr-only">{title}</span>
            </button>
        </Tooltip>
    );
};

export default ItemStar;
