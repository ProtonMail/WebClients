import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import { Icon } from '@proton/components';
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
                    <Icon name="arrow-up-and-left-big" alt={c('Alt').t`Replied to`} className="shrink-0 mr-1" />
                </Tooltip>
            )}
            {!!element.IsRepliedAll && (
                <Tooltip title={c('Alt').t`Replied to all`}>
                    <Icon name="arrows-up-and-left-big" alt={c('Alt').t`Replied to all`} className="shrink-0 mr-1" />
                </Tooltip>
            )}
            {!!element.IsForwarded && (
                <Tooltip title={c('Alt').t`Forwarded`}>
                    <Icon name="arrow-up-and-left-big" alt={c('Alt').t`Forwarded`} className="mirror shrink-0 mr-1" />
                </Tooltip>
            )}
        </div>
    );
};

export default ItemAction;
