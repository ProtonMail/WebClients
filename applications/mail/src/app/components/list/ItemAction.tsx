import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcArrowUpAndLeftBig } from '@proton/icons/icons/IcArrowUpAndLeftBig';
import { IcArrowsUpAndLeftBig } from '@proton/icons/icons/IcArrowsUpAndLeftBig';
import clsx from '@proton/utils/clsx';

import { isElementMessage } from '../../helpers/elements';
import type { Element } from '../../models/element';

interface Props {
    element?: Element;
    className?: string;
}

const ItemAction = ({ element, className }: Props) => {
    if (!isElementMessage(element)) {
        return null;
    }

    if (!element.IsReplied && !element.IsRepliedAll && !element.IsForwarded) {
        return null;
    }

    return (
        <div className={clsx(['flex flex-nowrap', className])}>
            {!!element.IsReplied && (
                <Tooltip title={c('Alt').t`Replied to`}>
                    <span className="shrink-0 mr-1">
                        <IcArrowUpAndLeftBig alt={c('Alt').t`Replied to`} />
                    </span>
                </Tooltip>
            )}
            {!!element.IsRepliedAll && (
                <Tooltip title={c('Alt').t`Replied to all`}>
                    <span className="shrink-0 mr-1">
                        <IcArrowsUpAndLeftBig alt={c('Alt').t`Replied to all`} />
                    </span>
                </Tooltip>
            )}
            {!!element.IsForwarded && (
                <Tooltip title={c('Alt').t`Forwarded`}>
                    <span className="mirror shrink-0 mr-1">
                        <IcArrowUpAndLeftBig alt={c('Alt').t`Forwarded`} />
                    </span>
                </Tooltip>
            )}
        </div>
    );
};

export default ItemAction;
