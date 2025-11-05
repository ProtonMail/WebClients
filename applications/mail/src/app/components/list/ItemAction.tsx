import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcArrowUpAndLeftBig, IcArrowsUpAndLeftBig } from '@proton/icons';
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
                    <IcArrowUpAndLeftBig alt={c('Alt').t`Replied to`} className="shrink-0 mr-1" />
                </Tooltip>
            )}
            {!!element.IsRepliedAll && (
                <Tooltip title={c('Alt').t`Replied to all`}>
                    <IcArrowsUpAndLeftBig alt={c('Alt').t`Replied to all`} className="shrink-0 mr-1" />
                </Tooltip>
            )}
            {!!element.IsForwarded && (
                <Tooltip title={c('Alt').t`Forwarded`}>
                    <IcArrowUpAndLeftBig alt={c('Alt').t`Forwarded`} className="mirror shrink-0 mr-1" />
                </Tooltip>
            )}
        </div>
    );
};

export default ItemAction;
