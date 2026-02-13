import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';

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
                <Icon className="color-weak" name="flag-filled" alt={c('Action').t`Report an issue`} />
            </Button>
        </Tooltip>
    );
}
