import { c } from 'ttag';

import { IcLockFilled } from '@proton/icons/icons/IcLockFilled';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    shortText?: boolean;
}
const HeaderSecureLabel = ({ className, shortText = false }: Props) => (
    <div className={clsx('flex flex-row', className)}>
        <IcLockFilled className="mr-2" />
        <span className="encryption-block-text">
            {shortText ? c('Info').t`Encrypted` : c('Info').t`End-to-end encrypted`}
        </span>
    </div>
);

export default HeaderSecureLabel;
