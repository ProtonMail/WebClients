import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

import { usePublicSessionUser } from '../../../store';

interface Props {
    className?: string;
}
export const ClosePartialPublicViewButton = ({ className }: Props) => {
    const { localID } = usePublicSessionUser();
    const handleClosePartialPublicView = () => {
        const sharedWithMeUrl = getAppHref('/shared-with-me', APPS.PROTONDRIVE, localID);
        window.location.assign(sharedWithMeUrl);
    };
    return (
        <Button
            icon
            className={className}
            shape="ghost"
            // translator: Go back action is going back to Proton Drive
            title={c('Action').t`Go back`}
            onClick={handleClosePartialPublicView}
            data-testid="public-preview:button:close"
        >
            <Icon className="mr-2" name="arrow-left" />
            {/* // translator: Go back action is going back to Proton Drive */}
            {c('Action').t`Go back`}
        </Button>
    );
};
