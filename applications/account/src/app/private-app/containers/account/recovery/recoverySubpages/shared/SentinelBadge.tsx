import type { StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { StatusBadge } from '@proton/components/containers/layout/StatusBadge';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

interface Props {
    text: string;
    status: StatusBadgeStatus;
    className?: string;
}

const SentinelBadge = ({ text, status, className }: Props) => (
    <div className={clsx(className, 'fade-in flex flex-column gap-2 items-start')}>
        <StatusBadge status={status} text={PROTON_SENTINEL_NAME} icon={IcShieldExclamationFilled} />
        <p className="m-0">{getBoldFormattedText(text)}</p>
    </div>
);

export default SentinelBadge;
