import { c } from 'ttag';

import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    shortText?: boolean;
}
const HeaderSecureLabel = ({ className, shortText = false }: Props) => (
    <div className={clsx('flex flex-row', className)}>
        <Icon name="lock-filled" className="mr-2" />
        <span className="encryption-block-text">
            {shortText ? c('Info').t`Encrypted` : c('Info').t`End-to-end encrypted`}
        </span>
    </div>
);

export default HeaderSecureLabel;
