import { c } from 'ttag';

import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
}
const HeaderSecureLabel = ({ className }: Props) => (
    <div className={clsx('color-success flex flex-row', className)}>
        <Icon name="lock-open-check-filled" className="mr-2" />
        <span className="encryption-block-text">{c('Info').t`End-to-end encrypted`}</span>
    </div>
);

export default HeaderSecureLabel;
