import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    CheckListAccountLogin,
    CheckListGmailForward,
    CheckListMobileStores,
    CheckListProtectInbox,
    useActiveBreakpoint,
} from '@proton/components';
import { ChecklistKey } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { isColumnMode } from 'proton-mail/helpers/mailSettings';
import useMailModel from 'proton-mail/hooks/useMailModel';

import OnboardingChecklistModalsProvider, {
    useOnboardingChecklistModalsContext,
} from '../../../OnboardingChecklistModalProvider';
import useOnboardingChecklist from '../../../useOnboardingChecklist';
import OldOnboardingChecklistPlaceholderHeader from './components/Header';

import '../../../UsersOnboardingChecklist.scss';

interface Props {
    hideDismissButton?: boolean;
    displayOnMobile?: boolean;
}

const OldOnboardingChecklistPlaceholder = ({ displayOnMobile = false, hideDismissButton = false }: Props) => {
    const mailSettings = useMailModel('MailSettings');
    const { viewportWidth } = useActiveBreakpoint();

    const { displayModal } = useOnboardingChecklistModalsContext();
    const { items, isChecklistFinished, canDisplayChecklist, isUserPaid, userWasRewarded } = useGetStartedChecklist();
    const { handleDismiss } = useOnboardingChecklist();

    if (!canDisplayChecklist) {
        return null;
    }

    return (
        <>
            <div
                data-testid="onboarding-checklist"
                className={clsx(
                    'w-full flex flex-column shrink-0',
                    // The checklist is displayed on both the list and details (right side when column mode), we need to hide it on the list when the side details view is visible
                    displayOnMobile && 'free-checklist--container',
                    isColumnMode(mailSettings) && !viewportWidth['<=small'] && 'justify-center h-full',
                    !viewportWidth['<=small'] && 'm-auto',
                    'max-w-full md:max-w-custom p-3 md:p-6 px-4 md:px-0 my-3 md:my-auto gap-6'
                )}
                style={{ '--md-max-w-custom': '30em' }}
            >
                <OldOnboardingChecklistPlaceholderHeader
                    isUserPaid={isUserPaid}
                    isChecklistFinished={isChecklistFinished}
                    userWasRewarded={userWasRewarded}
                />
                <ul className={clsx('flex flex-column unstyled my-0 gap-2 md:px-3')}>
                    <li>
                        <CheckListProtectInbox
                            onClick={() => displayModal('protectLogin', true)}
                            done={items.has(ChecklistKey.ProtectInbox)}
                        />
                    </li>
                    <li>
                        <CheckListGmailForward
                            onClick={() => displayModal('gmailForward', true)}
                            done={items.has(ChecklistKey.Import)}
                        />
                    </li>
                    <li>
                        <CheckListAccountLogin
                            onClick={() => displayModal('login', true)}
                            done={items.has(ChecklistKey.AccountLogin)}
                        />
                    </li>
                    <li>
                        <CheckListMobileStores
                            onClick={() => displayModal('mobileApps', true)}
                            done={items.has(ChecklistKey.MobileApp)}
                        />
                    </li>
                </ul>
                {!hideDismissButton && (
                    <div className="text-center">
                        <Button shape="outline" onClick={handleDismiss}>
                            {isChecklistFinished
                                ? c('Get started checklist instructions').t`Close`
                                : c('Get started checklist instructions').t`Maybe later`}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
};

const OldOnboardingChecklistPlaceholderWrapper = (props: Props) => (
    <OnboardingChecklistModalsProvider>
        <OldOnboardingChecklistPlaceholder {...props} />
    </OnboardingChecklistModalsProvider>
);

export default OldOnboardingChecklistPlaceholderWrapper;
