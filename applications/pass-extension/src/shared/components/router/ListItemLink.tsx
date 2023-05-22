import type { FC, HTMLProps } from 'react';

export const ListItemLink: FC<HTMLProps<HTMLAnchorElement> & { navigate: () => void }> = ({
    navigate,
    children,
    ...props
}) => {
    return (
        <li onClick={navigate}>
            <a {...props} href="#">
                {children}
            </a>
        </li>
    );
};
