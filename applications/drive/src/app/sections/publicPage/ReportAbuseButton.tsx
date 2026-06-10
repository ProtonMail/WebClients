import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcFlagFilled } from '@proton/icons/icons/IcFlagFilled';

interface ReportAbuseButtonProps {
    className?: string;
    onClick: () => void;
}

export default function ReportAbuseButton({ onClick, className }: ReportAbuseButtonProps) {
    return (
        <Tooltip title={c('Action').t`Report an issue`}>
            <Button
                shape="ghost"
                size="medium"
                color="weak"
                data-testid="report-abuse-button"
                className={className}
                icon
                onClick={onClick}
            >
                <IcFlagFilled className="color-weak" alt={c('Action').t`Report an issue`} />
            </Button>
        </Tooltip>
    );
}
