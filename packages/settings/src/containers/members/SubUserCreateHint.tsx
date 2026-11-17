import type { ReactNode } from 'react';

import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import clsx from '@proton/utils/clsx';

const SubUserCreateHint = ({ className, children }: { className?: string; children?: ReactNode }) => {
    return (
        <div className={clsx([className, 'py-2 px-2 border border-weak rounded flex flex-nowrap'])}>
            <IcInfoCircle className="mr-2 mt-0.5 shrink-0" />
            <div>{children}</div>
        </div>
    );
};

export default SubUserCreateHint;
