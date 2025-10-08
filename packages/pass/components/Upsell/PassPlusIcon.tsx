import type { FC } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

type Props = { className?: string };

export const PassPlusIcon: FC<Props> = ({ className }) => (
    <span className={clsx('flex items-center flex-nowrap', className)}>
        <Icon name="brand-proton-pass-filled" size={3} className="mt-0.5 mr-0.5" />
        <span>+</span>
    </span>
);
