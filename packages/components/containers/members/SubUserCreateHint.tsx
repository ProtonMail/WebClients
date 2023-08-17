import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

const SubUserCreateHint = ({ className = 'my-2' }: { className?: string }) => {
    return (
        <div className={clsx([className, 'my-2 py-2 px-3 bg-weak rounded flex flex-nowrap'])}>
            <Icon name="info-circle" className="mr-2 mt-0.5 flex-item-noshrink" />
            <span>{c('Info').t`Remember to share the user's sign in details with them.`}</span>
        </div>
    );
};

export default SubUserCreateHint;
