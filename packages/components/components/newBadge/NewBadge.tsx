import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

const NewBadge = ({ className }: { className?: string }) => (
    <span
        className={clsx(
            'new-badge flex items-center rounded color-primary bg-weak shrink-0 text-ellipsis text-semibold text-sm mt-1 mx-auto',
            className
        )}
    >
        <span>{c('Info').t`New`}</span>
    </span>
);

export default NewBadge;
