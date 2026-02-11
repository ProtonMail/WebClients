import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';

export default function ReportAbuseButton() {
    return (
        <Tooltip title={c('Action').t`Report an issue`}>
            <Button
                shape="ghost"
                size="medium"
                color="weak"
                data-testid="report-abuse-button"
                className="ml-0.5 mb-0.5 fixed left-0 bottom-0"
                icon
                onClick={() => alert('Not implemented yet')}
            >
                <Icon className="color-weak" name="flag-filled" alt={c('Action').t`Report an issue`} />
            </Button>
        </Tooltip>
    );
}
