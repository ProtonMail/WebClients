import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { SimpleSidebarListItemHeader } from '@proton/components';
import { IcCross } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

interface Props {
    canCloseChecklist: boolean;
    canDisplayCountDown: boolean;
    isOpened: boolean;
    onCloseChecklist: () => void;
    onToggleChecklist: (value: boolean) => void;
    remainingDaysCount: number;
}

const Counter = ({ children, title }: { children: ReactNode; title: string }) => (
    <div className="text-rg ml-2 mt-2">
        <span aria-label={title} className={clsx(['navigation-counter-item px-1 shrink-0'])} title={title}>
            {children}
        </span>
    </div>
);

const OnboardingChecklistSidebarHeader = ({
    canCloseChecklist,
    canDisplayCountDown,
    isOpened,
    onCloseChecklist,
    onToggleChecklist,
    remainingDaysCount,
}: Props) => {
    const { items, itemsToComplete } = useGetStartedChecklist();
    const itemsCompletedCount = itemsToComplete.filter((key) => items.has(key)).length;

    const action = canCloseChecklist ? (
        <button
            data-testid="onboarding-checklist-header-hide-button"
            className="flex navigation-link-header-group-control shrink-0 mt-1"
            onClick={onCloseChecklist}
        >
            <IcCross alt={c('Action').t`Close`} />
        </button>
    ) : (
        <Counter title={c('Get started checklist instructions').t`Tasks to complete count`}>
            {itemsCompletedCount}/{itemsToComplete.length}
        </Counter>
    );

    const text = canDisplayCountDown
        ? c('Get started checklist instructions').t`Get more storage`
        : c('Get started checklist instructions').t`Finish setup`;
    const subText =
        !isOpened && canDisplayCountDown
            ? c('Get started checklist instructions').ngettext(
                  msgid`${remainingDaysCount} day left`,
                  `${remainingDaysCount} days left`,
                  remainingDaysCount
              )
            : undefined;

    return (
        <SimpleSidebarListItemHeader
            className="items-start"
            forceMinBlockSize
            toggle={isOpened}
            onToggle={onToggleChecklist}
            text={text}
            subText={subText}
            right={action}
        />
    );
};

export default OnboardingChecklistSidebarHeader;
