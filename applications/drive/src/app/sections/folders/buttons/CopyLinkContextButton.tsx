import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import useLoading from '@proton/hooks/useLoading';
import { IcLink } from '@proton/icons/icons/IcLink';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';

interface Props {
    getPublicLinkInfo: () => Promise<{ url?: string; isExpired?: boolean } | undefined>;
    close: () => void;
}

export const CopyLinkContextButton = ({ getPublicLinkInfo, close }: Props) => {
    const [isLoading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const title = c('Action').t`Copy link`;

    const handleCopyURLClick = () =>
        withLoading(async () => {
            const publicLink = await getPublicLinkInfo();
            if (!publicLink?.url) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Can't find any secure link`,
                });
            } else if (publicLink.isExpired) {
                createNotification({
                    type: 'warning',
                    text: c('Notification').t`This secure link expired, please change expire date in sharing settings`,
                });
            } else {
                textToClipboard(publicLink.url);
                createNotification({
                    text: c('Success').t`Secure link copied`,
                });
            }
        });

    return (
        <ContextMenuButton
            name={title}
            icon={<IcLink />}
            testId="context-menu-copy-link"
            action={handleCopyURLClick}
            close={close}
        >
            {isLoading && <CircleLoader />}
        </ContextMenuButton>
    );
};
