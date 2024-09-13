import type { ReactNode } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

const SubUserCreateHint = ({ className, children }: { className?: string; children?: ReactNode }) => {
    return (
        <div className={clsx([className, 'py-2 px-3 border border-weak rounded flex flex-nowrap'])}>
            <Icon name="info-circle" className="mr-2 mt-0.5 shrink-0" />
            <div>{children}</div>
        </div>
    );
};

export default SubUserCreateHint;
