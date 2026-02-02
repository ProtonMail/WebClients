import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

export function GoBackButton() {
    const handleGoBack = () => {
        const sharedWithMeUrl = getAppHref('/shared-with-me', APPS.PROTONDRIVE);
        window.location.assign(sharedWithMeUrl);
    };

    return (
        <Button
            icon
            className="flex items-center"
            shape="ghost"
            title={c('Action').t`Go back`}
            onClick={handleGoBack}
            data-testid="public-preview:button:close"
        >
            <Icon className="mr-2" name="arrow-left" />
            {c('Action').t`Go back`}
        </Button>
    );
}
