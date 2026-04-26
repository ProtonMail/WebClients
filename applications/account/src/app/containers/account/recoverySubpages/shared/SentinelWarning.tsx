import { DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

interface Props {
    text: string;
}

const SentinelWarning = ({ text }: Props) => (
    <div className="fade-in">
        <DashboardCardDivider />
        <div className="flex flex-column gap-2 items-start">
            <StatusBadge
                status={StatusBadgeStatus.Warning}
                text={PROTON_SENTINEL_NAME}
                icon={IcShieldExclamationFilled}
            />
            <p className="m-0">{getBoldFormattedText(text)}</p>
        </div>
    </div>
);

export default SentinelWarning;
