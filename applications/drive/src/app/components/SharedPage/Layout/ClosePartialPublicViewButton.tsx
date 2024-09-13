import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

import { usePublicSessionUser } from '../../../store';

export interface Props {
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
            title={c('Action').t`Close`}
            onClick={handleClosePartialPublicView}
            data-testid="public-preview:button:close"
        >
            <Icon name="cross-big" />
        </Button>
    );
};
