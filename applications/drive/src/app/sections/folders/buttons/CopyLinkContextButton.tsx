import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { useNotifications } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';

interface Props {
    getPublicLinkInfo: () => Promise<{ url?: string; isExpired?: boolean } | undefined>;
    close: () => void;
}

export const CopyLinkContextButton = ({ getPublicLinkInfo, close }: Props) => {
    const [isLoading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

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
            name={c('Action').t`Copy link`}
            icon="link"
            testId="context-menu-copy-link"
            action={handleCopyURLClick}
            close={close}
        >
            {isLoading && <CircleLoader />}
        </ContextMenuButton>
    );
};
