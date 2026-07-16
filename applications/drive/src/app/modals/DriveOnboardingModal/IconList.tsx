import { type ReactElement, memo } from 'react';

type Props = {
    items: ({ text: string; icon?: ReactElement } | false)[];
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
                        {icon}
                        <span className="flex-1">{text}</span>
                    </li>
                );
            })}
        </ul>
    );
});
IconList.displayName = 'IconList';
