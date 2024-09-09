import { useRef } from 'react';

import { c } from 'ttag';

import { Avatar, Button, Input } from '@proton/atoms';
import { Icon, Toggle, useNotifications } from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

interface Props {
    publicSharedLink: string;
    createSharedLink: () => void;
    deleteSharedLink: () => void;
    isLoading: boolean;
}
export const PublicSharing = ({ publicSharedLink, createSharedLink, deleteSharedLink, isLoading }: Props) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const { createNotification } = useNotifications();
    const handleCopyURLClick = () => {
        if (contentRef.current) {
            textToClipboard(publicSharedLink, contentRef.current);
            createNotification({
                text: c('Success').t`Secure link copied`,
            });
        }
    };

    const handleToggle = () => {
        if (publicSharedLink) {
            deleteSharedLink();
        } else {
            createSharedLink();
        }
    };

    return (
        <div className="w-full" ref={contentRef} data-testid="share-modal-shareWithAnyoneSection">
            <div className="flex justify-space-between items-center mb-6">
                <h2 className="text-lg text-semibold mr">{c('Info').t`Create public link`}</h2>
                <Toggle checked={!!publicSharedLink} loading={isLoading} onChange={handleToggle} />
            </div>
            <div className={clsx('flex items-center justify-space-between mb-4', !publicSharedLink && 'opacity-30')}>
                <div className="flex items-center">
                    <Avatar color="weak" className="mr-2 shrink-0">
                        <Icon name="globe" />
                    </Avatar>
                    <p className="flex-1 flex flex-column p-0 m-0">
                        <span className="text-semibold">{c('Label').t`Anyone with the link`}</span>
                        <span className="color-weak">{c('Label')
                            .t`Anyone on the Internet with the link can view`}</span>
                    </p>
                </div>
                <div className="hidden sm:block shrink-0">{c('Label').t`Viewer`}</div>
            </div>
            {!!publicSharedLink ? (
                <div className="w-full flex justify-space-between">
                    <Input
                        readOnly
                        value={publicSharedLink}
                        className="overflow-hidden text-ellipsis bg-weak border-weak color-weak"
                        data-testid="share-anyone-url"
                        disabled={!publicSharedLink}
                    />
                    <Button
                        color="norm"
                        shape="outline"
                        icon
                        id="copy-url-button"
                        onClick={handleCopyURLClick}
                        className="ml-3"
                        disabled={!publicSharedLink}
                        data-testid="share-anyone-copyUrlButton"
                    >
                        <Icon name="squares" />
                    </Button>
                </div>
            ) : null}
        </div>
    );
};
