import type { FC, PropsWithChildren } from 'react';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

import './RevisionsListItem.scss';

type Props = {
    onClick?: () => void;
    className?: string;
};

export const RevisionsListItem: FC<PropsWithChildren<Props>> = ({ children, className, onClick }) => {
    return (
        <Button
            shape="ghost"
            fullWidth
            className={clsx(
                'pass-revision-list--item flex justify-space-between flex-nowrap items-center',
                !onClick && 'not-clickable',
                className
            )}
            onClick={onClick}
        >
            {children}
            {onClick && <Icon name="chevron-right" size={5} className="color-weak" />}
        </Button>
    );
};
