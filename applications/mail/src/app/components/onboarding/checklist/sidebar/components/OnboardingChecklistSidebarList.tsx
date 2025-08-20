import React from 'react';

import {
    CheckListAccountLogin,
    CheckListGmailForward,
    CheckListMobileStores,
    CheckListProtectInbox,
} from '@proton/components';
import { CheckListClaimProtonAddress } from '@proton/components/components/checklist/CheckList';
import { ChecklistKey } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import { useOnboardingChecklistModalsContext } from '../../OnboardingChecklistModalsProvider';

const OnboardingChecklistSidebarList = () => {
    const { displayModal } = useOnboardingChecklistModalsContext();
    const { items, itemsToComplete } = useGetStartedChecklist();

    if (itemsToComplete.length === 0) {
        return null;
    }

    return (
        <ul className={clsx('flex flex-column unstyled my-0')}>
            {itemsToComplete.includes(ChecklistKey.ProtectInbox) && (
                <li>
                    <CheckListProtectInbox
                        smallVariant
                        onClick={() => displayModal('protectLogin', true)}
                        style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
                        done={items.has(ChecklistKey.ProtectInbox)}
                    />
                </li>
            )}
            {itemsToComplete.includes(ChecklistKey.Import) && (
                <li>
                    <CheckListGmailForward
                        smallVariant
                        onClick={() => displayModal('gmailForward', true)}
                        done={items.has(ChecklistKey.Import)}
                    />
                </li>
            )}
            {itemsToComplete.includes(ChecklistKey.ClaimAddress) && (
                <li>
                    <CheckListClaimProtonAddress
                        smallVariant
                        onClick={() => displayModal('claimProtonAddress', true)}
                        done={items.has(ChecklistKey.ClaimAddress)}
                    />
                </li>
            )}
            {itemsToComplete.includes(ChecklistKey.AccountLogin) && (
                <li>
                    <CheckListAccountLogin
                        smallVariant
                        onClick={() => displayModal('login', true)}
                        done={items.has(ChecklistKey.AccountLogin)}
                    />
                </li>
            )}
            {itemsToComplete.includes(ChecklistKey.MobileApp) && (
                <li>
                    <CheckListMobileStores
                        smallVariant
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
