import React from 'react';

import {
    CheckListAccountLogin,
    CheckListGmailForward,
    CheckListMobileStores,
    CheckListProtectInbox,
} from '@proton/components/index';
import { ChecklistKey } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import { useOnboardingChecklistModalsContext } from '../../OnboardingChecklistModalProvider';

const OnboardingChecklistSidebarList = () => {
    const { displayModal } = useOnboardingChecklistModalsContext();
    const { items } = useGetStartedChecklist();
    return (
        <ul className={clsx('flex flex-column unstyled my-0')}>
            <li>
                <CheckListProtectInbox
                    smallVariant
                    onClick={() => displayModal('protectLogin', true)}
                    style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
                    done={items.has(ChecklistKey.ProtectInbox)}
                />
            </li>
            <li>
                <CheckListGmailForward
                    smallVariant
                    onClick={() => displayModal('gmailForward', true)}
                    done={items.has(ChecklistKey.Import)}
                />
            </li>
            <li>
                <CheckListAccountLogin
                    smallVariant
                    onClick={() => displayModal('login', true)}
                    done={items.has(ChecklistKey.AccountLogin)}
                />
            </li>
            <li>
                <CheckListMobileStores
                    smallVariant
                    style={{ borderRadius: '0 0 0.5rem 0.5rem' }}
                    onClick={() => displayModal('mobileApps', true)}
                    done={items.has(ChecklistKey.MobileApp)}
                />
            </li>
        </ul>
    );
};

export default OnboardingChecklistSidebarList;
