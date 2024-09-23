import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { Tooltip } from '@proton/components';
import Icon, { type IconSize } from '@proton/components/components/icon/Icon';
import { useLoading } from '@proton/hooks';
import clsx from '@proton/utils/clsx';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { isMessage, isStarred as testIsStarred } from '../../helpers/elements';
import { useStar } from '../../hooks/actions/useStar';
import type { Element } from '../../models/element';

interface Props {
    element?: Element;
    size?: IconSize;
}

const ItemStar = ({ element, size }: Props) => {
    const [loading, withLoading] = useLoading();
    const star = useStar();
    const { Shortcuts } = useMailModel('MailSettings');

    const isStarred = testIsStarred(element || ({} as Element));

    const title = isMessage(element)
        ? isStarred
            ? c('Alt').t`Unstar message`
            : c('Alt').t`Star message`
        : isStarred
          ? c('Alt').t`Unstar conversation`
          : c('Alt').t`Star conversation`;

    const buttonTxt = isMessage(element) ? c('Alt').t`Star message` : c('Alt').t`Star conversation`;

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
                        <Kbd shortcut="*" />
                    </>
                ) : (
                    title
                )
            }
        >
            <button
                data-testid={`item-star-${isStarred}`}
                type="button"
                className={clsx([
                    'starbutton relative item-star flex stop-propagation',
                    isStarred && 'starbutton--is-starred',
                ])}
                onClick={handleClick}
                aria-pressed={isStarred}
            >
                <Icon size={size} name={isStarred ? 'star-filled' : 'star'} />
                <span className="sr-only">{buttonTxt}</span>
            </button>
        </Tooltip>
    );
};

export default ItemStar;
