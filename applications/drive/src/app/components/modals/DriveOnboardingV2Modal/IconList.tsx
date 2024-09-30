import { memo } from 'react';

import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';

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
                    <li key={text} className="flex items-center gap-2 my-1">
                        {icon ? <Icon name={icon} /> : null}
                        {text}
                    </li>
                );
            })}
        </ul>
    );
});
IconList.displayName = 'IconList';
