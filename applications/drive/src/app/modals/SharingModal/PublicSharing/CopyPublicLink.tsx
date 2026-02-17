import { useState } from 'react';

import { c } from 'ttag';

import { Input } from '@proton/atoms/Input/Input';
import { ButtonWithTextAndIcon } from '@proton/components/components/button/ButtonWithTextAndIcon';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

export function CopyPublicLink({ url, onClick, disabled }: { url?: string; onClick: () => void; disabled: boolean }) {
    const [recentlyCopied, setRecentlyCopied] = useState(false);

    const handleClick = () => {
        onClick();
        setRecentlyCopied(true);
        setTimeout(() => {
            setRecentlyCopied(false);
        }, 3000);
    };

    return (
        <div className="flex justify-space-between gap-4 w-full">
            <Input
                className={!url ? 'border-none' : ''}
                inputClassName={clsx(
                    'overflow-hidden text-ellipsis color-hint',
                    !url && 'bg-weak pointer-events-none user-select-none'
                )}
                readOnly
                value={url ?? getAppHref('', APPS.PROTONDRIVE)}
                data-testid="share-anyone-url"
                disabled={!url}
            />
            <ButtonWithTextAndIcon
                color={recentlyCopied ? 'success' : 'norm'}
                shape="outline"
                onClick={handleClick}
                disabled={disabled}
                buttonText={recentlyCopied ? c('Info').t`Link copied` : c('Action').t`Copy link`}
                iconName={recentlyCopied ? 'pass-shield-fill-success' : 'link'}
                dataTestId="share-anyone-copyUrlButton"
            />
        </div>
    );
}
