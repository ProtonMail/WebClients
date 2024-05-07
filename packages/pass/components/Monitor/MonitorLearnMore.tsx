import { type FC, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Collapsible, CollapsibleContent, CollapsibleHeader } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import CollapsibleHeaderToggleButton from '@proton/pass/components/Layout/Button/CollapsibleHeaderToggleButton';
import { LearnMoreCard, type LearnMoreProps } from '@proton/pass/components/Layout/Card/LearnMoreCard';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { type MaybeNull, OnboardingMessage } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const MonitorLearnMore: FC = () => {
    const { onLink, onboardingCheck, onboardingAcknowledge } = usePassCore();
    const anchorRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState<MaybeNull<boolean>>(null);

    const handleClick = () => {
        void onboardingAcknowledge?.(OnboardingMessage.PASS_MONITOR_LEARN_MORE);
        setTimeout(() => anchorRef?.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    useEffect(() => {
        (async () => onboardingCheck?.(OnboardingMessage.PASS_MONITOR_LEARN_MORE))()
            .then((expanded) => setExpanded(expanded === undefined || expanded))
            .catch(noop);
    }, []);

    const learnMore: LearnMoreProps[] = useMemo(
        () => [
            {
                icon: 'earth',
                title: c('Title').t`What is the dark web?`,
                description: c('Description')
                    .t`The dark web is a hidden part of the internet where stolen personal information, like identities, can be bought and sold.`,
                ctaLabel: c('Action').t`Learn more`,
                ctaAction: () => onLink('https://proton.me/blog/what-is-dark-web'),
            },
            {
                icon: 'alias',
                iconClassName: SubTheme.TEAL,
                title: c('Title').t`What is an alias?`,
                description: c('Description')
                    .t`An email alias works like an email address, but reduces spam and keeps your actual email address and identity hidden.`,
                ctaLabel: c('Action').t`Learn more`,
                ctaAction: () => onLink('https://proton.me/pass/aliases'),
            },
            {
                icon: 'locks',
                iconClassName: SubTheme.VIOLET,
                title: c('Title').t`Set up 2FA for better security`,
                description: c('Description')
                    .t`2FA adds another layer of security to your logins. ${PASS_APP_NAME} makes 2FA easier by storing and automatically autofilling your 2FA codes.`,
                ctaLabel: c('Action').t`Learn more`,
                ctaAction: () => onLink('https://proton.me/support/pass-2fa'),
            },
        ],
        []
    );

    return (
        expanded !== null && (
            <Collapsible expandByDefault={expanded}>
                <CollapsibleHeader
                    onClick={handleClick}
                    suffix={
                        <CollapsibleHeaderToggleButton color="weak" shape="solid" pill icon onClick={handleClick} />
                    }
                >
                    <h3 className="text-xl text-semibold">{c('Title').t`Want to learn more?`}</h3>
                    <span>{c('Description')
                        .t`Keep your info more secure and private with these guides and tips.`}</span>
                </CollapsibleHeader>
                <CollapsibleContent>
                    <div className="flex md:flex-nowrap w-full gap-4 items-stretch mt-6" ref={anchorRef}>
                        {learnMore.map((props, idx) => (
                            <LearnMoreCard key={`learn-more-${idx}`} {...props} />
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        )
    );
};
