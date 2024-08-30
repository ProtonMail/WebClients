import type { FC } from 'react';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import { CardContent, type CardContentProps } from '@proton/pass/components/Layout/Card/CardContent';
import clsx from '@proton/utils/clsx';

type Props = CardContentProps & { onClick?: () => void };

export const RevisionItem: FC<Props> = ({ onClick, ...cardProps }) => {
    return (
        <Button
            shape="ghost"
            fullWidth
            size="medium"
            className={clsx(
                'bg-weak border-norm flex justify-space-between flex-nowrap items-center rounded-xl',
                !onClick && 'pointer-events-none cursor-default'
            )}
            onClick={onClick}
        >
            <CardContent {...cardProps} className="py-1" />
            {onClick && <Icon name="chevron-right" size={5} className="color-weak" />}
        </Button>
    );
};
