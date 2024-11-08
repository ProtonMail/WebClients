import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { Icon, SimpleSidebarListItemHeader } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    hasReachedLimit: boolean;
    isChecklistFinished: boolean;
    isOpened: boolean;
    itemsCompletedCount: number;
    itemsToCompleteCount: number;
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
    hasReachedLimit,
    isChecklistFinished,
    isOpened,
    itemsCompletedCount,
    itemsToCompleteCount,
    onCloseChecklist,
    onToggleChecklist,
    remainingDaysCount,
}: Props) => {
    const action =
        isChecklistFinished || hasReachedLimit ? (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <button
                data-testid="onboarding-checklist-header-hide-button"
                className="flex navigation-link-header-group-control shrink-0 mt-1"
                onClick={onCloseChecklist}
            >
                <Icon name="cross" alt={c('Action').t`Close`} />
            </button>
        ) : (
            <Counter title={c('Get started checklist instructions').t`Tasks to complete count`}>
                {itemsCompletedCount}/{itemsToCompleteCount}
            </Counter>
        );

    const { text, subText } = (() => {
        let text = c('Get started checklist instructions').t`Get more storage`;
        let subText = undefined;

        if (hasReachedLimit || isChecklistFinished) {
            text = c('Get started checklist instructions').t`Finish setup`;
        }
        if (!isOpened && !(isChecklistFinished || hasReachedLimit)) {
            subText = c('Get started checklist instructions').ngettext(
                msgid`${remainingDaysCount} day left`,
                `${remainingDaysCount} days left`,
                remainingDaysCount
            );
        }

        return { text, subText };
    })();

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
