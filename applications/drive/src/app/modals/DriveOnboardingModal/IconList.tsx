import { memo } from 'react';

import { Icon } from '@proton/components';
import type { IconName } from '@proton/icons/types';

type Props = {
    items: ({ text: string; icon?: IconName } | false)[];
};

export const IconList = memo(({ items }: Props) => {
    return (
        <ul className="unstyled">
            {items.map((item) => {
                if (!item) {
                    return null;
                }

                const { text, icon } = item;

                return (
                    <li key={text} className="flex flex-row flex-nowrap items-start gap-2 my-1">
                        {icon ? <Icon name={icon} className="shrink-0 mt-0.5" /> : null}
                        <span className="flex-1">{text}</span>
                    </li>
                );
            })}
        </ul>
    );
});
IconList.displayName = 'IconList';
