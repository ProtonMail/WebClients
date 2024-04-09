import type { FC } from 'react';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/index';
import { InfoCard, type InfoCardProps } from '@proton/pass/components/Layout/Card/InfoCard';
import clsx from '@proton/utils/clsx';

type Props = InfoCardProps & { onClick?: () => void };

export const RevisionItem: FC<Props> = ({ onClick, ...infoCardProps }) => {
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
            <InfoCard {...infoCardProps} className="py-1" />
            {onClick && <Icon name="chevron-right" size={5} className="color-weak" />}
        </Button>
    );
};
