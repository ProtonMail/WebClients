import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
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
            <IcArrowLeft className="mr-2 rtl:mirror" />
            {c('Action').t`Go back`}
        </Button>
    );
}
