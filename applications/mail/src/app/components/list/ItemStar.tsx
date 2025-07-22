import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { Kbd, Tooltip } from '@proton/atoms';
import Icon, { type IconSize } from '@proton/components/components/icon/Icon';
import { useLoading } from '@proton/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';
import useMailModel from 'proton-mail/hooks/useMailModel';

import { isMessage, isStarred as testIsStarred } from '../../helpers/elements';
import { useStar } from '../../hooks/actions/useStar';
import type { Element } from '../../models/element';
import type { SOURCE_ACTION } from './list-telemetry/useListTelemetry';

interface Props {
    element?: Element;
    labelID: string;
    size?: IconSize;
    sourceAction: SOURCE_ACTION;
}

const ItemStar = ({ element, size, labelID, sourceAction }: Props) => {
    const [loading, withLoading] = useLoading();
    const { enabled: applyLocationEnabled, applyLocation } = useApplyLocation();
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

        if (loading) {
            return;
        }

        if (applyLocationEnabled) {
            void withLoading(
                applyLocation({
                    elements: [element || ({} as Element)],
                    targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                    removeLabel: isStarred,
                    showSuccessNotification: false,
                    createFilters: false,
                })
            );
        } else {
            void withLoading(star([element || ({} as Element)], !isStarred, labelID, sourceAction));
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
