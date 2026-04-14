import type { FC } from 'react';

import { IcBrandProtonPassFilled } from '@proton/icons/icons/IcBrandProtonPassFilled';
import clsx from '@proton/utils/clsx';

type Props = { className?: string };

export const PassPlusIcon: FC<Props> = ({ className }) => (
    <span className={clsx('flex items-center flex-nowrap', className)}>
        <IcBrandProtonPassFilled size={3} className="mt-0.5 mr-0.5" />
        <span>+</span>
    </span>
);
