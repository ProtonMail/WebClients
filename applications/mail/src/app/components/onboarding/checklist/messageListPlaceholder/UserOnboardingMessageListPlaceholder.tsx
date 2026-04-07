import { useState } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { ChecklistKey } from '@proton/shared/lib/interfaces';

import { UserOnboardingImporters } from 'proton-mail/components/onboarding/checklist/messageListPlaceholder/UserOnboardingImporters';
import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { isColumnMode } from 'proton-mail/helpers/mailSettings';

import UserOnboardingAccountsSwitcher from './UserOnboardingAccountsSwitcher';

const enum ListPlaceholderStep {
    AccountsSwitcher = 'accountsSwitcher',
    Importers = 'importers',
}

interface Props {
    location: 'list' | 'emptyPlaceholder' | 'mailboxContainerPlaceholder';
}

/**
 * Displayed in mail list as a placeholder when:
 * - no messages
 * - onboarding is done
 */
const UserOnboardingMessageListPlaceholder = ({ location }: Props) => {
    const [mailSettings] = useMailSettings();
    const { itemsToComplete, items: doneItems } = useGetStartedChecklist();
    const { viewportWidth } = useActiveBreakpoint();
    const hidden = location === 'list' && viewportWidth['>=large'] ? isColumnMode(mailSettings) : undefined;
    const hasCompletedImport = doneItems.has(ChecklistKey.Import);
    const [step, setStep] = useState<ListPlaceholderStep>(
        itemsToComplete.includes('Import') && !hasCompletedImport
            ? ListPlaceholderStep.Importers
            : ListPlaceholderStep.AccountsSwitcher
    );

    if (hidden) {
        return null;
    }

    return step === ListPlaceholderStep.Importers ? (
        <UserOnboardingImporters goToNextStep={() => setStep(ListPlaceholderStep.AccountsSwitcher)} />
    ) : (
        <UserOnboardingAccountsSwitcher />
    );
};

export default UserOnboardingMessageListPlaceholder;
