import { useEffect } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import {
    CheckListAccountLogin,
    CheckListGmailForward,
    CheckListMobileStores,
    CheckListProtectInbox,
    useActiveBreakpoint,
    useLocalState,
} from '@proton/components';
import { CHECKLIST_DISPLAY_TYPE, ChecklistKey } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { deleteCheckedItemsForUser } from 'proton-mail/helpers/checklist/checkedItemsStorage';
import { isColumnMode } from 'proton-mail/helpers/mailSettings';
import useMailModel from 'proton-mail/hooks/useMailModel';

import OnboardingChecklistProvider, { useOnboardingChecklistContext } from './OnboardingChecklistProvider';
import UsersOnboardingChecklistHeader from './UsersOnboardingChecklistHeader';

import './UsersOnboardingChecklist.scss';

interface Props {
    smallVariant?: boolean;
    hideDismissButton?: boolean;
    displayOnMobile?: boolean;
}

const UsersOnboardingChecklist = ({
    smallVariant = false,
    displayOnMobile = false,
    hideDismissButton = false,
}: Props) => {
    const mailSettings = useMailModel('MailSettings');
    const { viewportWidth } = useActiveBreakpoint();
    const [user] = useUser();

    const isImporterInMaintenance = useFlag('MaintenanceImporter');
    const { isModalOpened, displayModal } = useOnboardingChecklistContext();

    const [rewardShowed, setRewardShowed] = useLocalState(false, 'checklist-reward-showed');

    const { items, changeChecklistDisplay, isChecklistFinished, userWasRewarded, canDisplayChecklist } =
        useGetStartedChecklist();

    const areAllModalsClosed =
        !isModalOpened('gmailForward') &&
        !isModalOpened('protectLogin') &&
        !isModalOpened('login') &&
        !isModalOpened('mobileApps');

    const canOpenStorageReward =
        // Can see storage reward modal
        isChecklistFinished &&
        !userWasRewarded &&
        !rewardShowed &&
        // All modals are closed
        areAllModalsClosed;

    useEffect(() => {
        if (canOpenStorageReward) {
            displayModal('storageReward', true);
            setRewardShowed(true);
        }
    }, [isChecklistFinished, areAllModalsClosed]);

    const handleDismiss = () => {
        // Clean the session storage state
        if (isChecklistFinished) {
            deleteCheckedItemsForUser(user.ID);
        }

        const newState = isChecklistFinished ? CHECKLIST_DISPLAY_TYPE.HIDDEN : CHECKLIST_DISPLAY_TYPE.REDUCED;
        changeChecklistDisplay(newState);
    };

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
                    isColumnMode(mailSettings) && !smallVariant && !viewportWidth['<=small'] && 'justify-center h-full',
                    !viewportWidth['<=small'] && !smallVariant && 'm-auto',
                    smallVariant
                        ? 'px-2 self-end'
                        : 'max-w-full md:max-w-custom p-3 md:p-6 px-4 md:px-0 my-3 md:my-auto gap-6'
                )}
                style={smallVariant ? undefined : { '--md-max-w-custom': '30em' }}
            >
                <UsersOnboardingChecklistHeader smallVariant={smallVariant} />
                <ul className={clsx('flex flex-column unstyled my-0', !smallVariant && 'gap-2 md:px-3')}>
                    <li>
                        <CheckListProtectInbox
                            smallVariant={smallVariant}
                            data-testid="testing-flavien-checklist-protect-inbox"
                            onClick={() => displayModal('protectLogin', true)}
                            style={{ borderRadius: smallVariant ? '0.5rem 0.5rem 0 0' : null }}
                            done={items.has(ChecklistKey.ProtectInbox)}
                        />
                    </li>
                    <li>
                        <CheckListGmailForward
                            isInMaintenance={isImporterInMaintenance}
                            data-testid="testing-flavien-checklist-gmail-forward"
                            smallVariant={smallVariant}
                            onClick={() => displayModal('gmailForward', true)}
                            done={items.has(ChecklistKey.Import)}
                        />
                    </li>
                    <li>
                        <CheckListAccountLogin
                            smallVariant={smallVariant}
                            data-testid="testing-flavien-checklist-account-login"
                            onClick={() => displayModal('login', true)}
                            done={items.has(ChecklistKey.AccountLogin)}
                        />
                    </li>
                    <li>
                        <CheckListMobileStores
                            smallVariant={smallVariant}
                            data-testid="testing-flavien-checklist-mobile-apps"
                            style={{ borderRadius: smallVariant ? '0 0 0.5rem 0.5rem' : null }}
                            onClick={() => displayModal('mobileApps', true)}
                            done={items.has(ChecklistKey.MobileApp)}
                        />
                    </li>
                </ul>
                {!smallVariant && !hideDismissButton && (
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

const UsersOnboardingChecklistWrapper = (props: Props) => {
    return (
        <OnboardingChecklistProvider>
            <UsersOnboardingChecklist {...props} />
        </OnboardingChecklistProvider>
    );
};

export default UsersOnboardingChecklistWrapper;
