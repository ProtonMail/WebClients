import React from 'react';

import {
    CheckListClaimProtonAddress,
    CheckListMobileStores,
    CheckListProtectInbox,
    CheckListReviewImports,
} from '@proton/components/components/checklist/CheckList';
import { ChecklistKey } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import { useOnboardingChecklistModalsContext } from '../../OnboardingChecklistModalsProvider';

const OnboardingChecklistSidebarList = () => {
    const { displayModal } = useOnboardingChecklistModalsContext();
    const { items, itemsToComplete, markItemsAsDone } = useGetStartedChecklist();

    if (itemsToComplete.length === 0) {
        return null;
    }

    return (
        <ul className={clsx('flex flex-column unstyled my-0')}>
            {itemsToComplete.includes(ChecklistKey.ProtectInbox) && (
                <li>
                    <CheckListProtectInbox
                        onClick={() => displayModal('protectLogin', true)}
                        style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
                        done={items.has(ChecklistKey.ProtectInbox)}
                    />
                </li>
            )}
            {itemsToComplete.includes(ChecklistKey.Import) && (
                <li>
                    <CheckListReviewImports
                        onClick={async () => {
                            if (itemsToComplete.includes(ChecklistKey.Import)) {
                                await markItemsAsDone(ChecklistKey.Import);
                            }
                        }}
                        done={items.has(ChecklistKey.Import)}
                    />
                </li>
            )}
            {itemsToComplete.includes(ChecklistKey.ClaimAddress) && (
                <li>
                    <CheckListClaimProtonAddress
                        onClick={() => displayModal('claimProtonAddress', true)}
                        done={items.has(ChecklistKey.ClaimAddress)}
                    />
                </li>
            )}
            {itemsToComplete.includes(ChecklistKey.MobileApp) && (
                <li>
                    <CheckListMobileStores
                        style={{ borderRadius: '0 0 0.5rem 0.5rem' }}
                        onClick={() => displayModal('mobileApps', true)}
                        done={items.has(ChecklistKey.MobileApp)}
                    />
                </li>
            )}
        </ul>
    );
};

export default OnboardingChecklistSidebarList;
