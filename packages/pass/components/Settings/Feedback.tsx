import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PASS_HOWTO_URL, PASS_REDDIT_URL, PASS_REQUEST_URL, PASS_X_URL } from '@proton/pass/constants';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsPanel } from './SettingsPanel';

export const Feedback: FC = () => {
    const { onLink } = usePassCore();

    const feedback = [
        {
            icon: 'life-ring' as const,
            label: c('Action').t`How to use ${PASS_APP_NAME}`,
            url: PASS_HOWTO_URL,
        },
        {
            icon: 'brand-twitter' as const,
            label: c('Action').t`Write us on X/Twitter`,
            url: PASS_X_URL,
        },
        {
            icon: 'brand-reddit' as const,
            label: c('Action').t`Join our Reddit`,
            url: PASS_REDDIT_URL,
        },
        {
            icon: 'rocket' as const,
            label: c('Action').t`Request a feature`,
            url: PASS_REQUEST_URL,
        },
    ];

    return (
        <SettingsPanel title={c('Label').t`Feedback`}>
            {feedback.map(({ url, label, icon }) => (
                <Button
                    onClick={() => onLink(url)}
                    className="w-full flex items-center gap-2 shrink-0 flex-nowrap"
                    size="small"
                    shape="ghost"
                    key={label}
                    title={label}
                    icon
                >
                    <Icon name={icon} />
                    {label}
                </Button>
            ))}
        </SettingsPanel>
    );
};
