import type { FC } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import truncate from '@proton/utils/truncate';

export const ActivationLink: FC<{ href: string }> = ({ href }) => {
    const { createNotification } = useNotifications();

    const displayLink = truncate(href.replace('https://', ''));

    return (
        <div className="absolute left-0 bottom-0 w-full border-top border-weak p-4 bg-norm text-center">
            <div className="text-semibold">{c('BOSS').t`Activation link`}</div>
            <Tooltip title={c('BOSS').t`Copy activation link to clipboard`}>
                <Href
                    className="color-weak text-no-decoration inline-flex items-center justify-center gap-3"
                    href={href}
                    onClick={(e) => {
                        e.preventDefault();
                        textToClipboard(href);
                        createNotification({
                            text: c('BOSS').t`Activation link copied to clipboard`,
                        });
                    }}
                >
                    {displayLink}
                    <IcSquares className="color-primary" />
                </Href>
            </Tooltip>
        </div>
    );
};
