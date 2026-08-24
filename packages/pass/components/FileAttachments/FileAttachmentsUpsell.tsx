import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import { UpsellRef } from '../../constants';
import { useNavigateToUpgrade } from '../../hooks/useNavigateToUpgrade';
import { selectUser, selectUserPlan } from '../../store/selectors';
import { Card } from '../Layout/Card/Card';

type Props = {
    /** Pass Ess users upgrade via an inline link (admin) or their admin (member),
     * instead of the B2C upsell modal. */
    isPassEssentials: boolean;

    /** Open the B2C upsell modal (non-Essentials users). */
    onUpsell: () => void;
};

/** Upsell rendered in place of the upload button when the user cannot use
 * storage. Existing files are still rendered (e.g. in case of downgrade)
 */
export const FileAttachmentsUpsell: FC<Props> = ({ isPassEssentials, onUpsell }) => {
    const user = useSelector(selectUser);
    const userPlan = useSelector(selectUserPlan);
    const navigateToUpgrade = useNavigateToUpgrade({
        upsellRef: UpsellRef.FILE_ATTACHMENTS,
        targetPage: 'compare',
        plan: userPlan?.InternalName,
    });

    if (isPassEssentials) {
        const userIsAdmin = user ? isAdmin(user) : false;
        const upgradeLink = (
            <InlineLinkButton key="upgrade-link" className="p-0" onClick={() => navigateToUpgrade()}>
                {c('Action').t`Upgrade`}
            </InlineLinkButton>
        );

        return (
            <Card className="mx-4 mb-4" type="primary">
                {userIsAdmin
                    ? c('Pass_file_attachments').jt`This feature is not supported in your plan. ${upgradeLink}`
                    : c('Pass_file_attachments')
                          .t`This feature is not supported in your plan. Contact your admin to gain access.`}
            </Card>
        );
    }

    return (
        <div className="m-4">
            <Button
                className="button-fluid rounded-full inline-block"
                shape="solid"
                color="weak"
                onClick={onUpsell}
                fullWidth
            >
                {c('Pass_file_attachments').t`Choose a file or drag it here`}
            </Button>
        </div>
    );
};
