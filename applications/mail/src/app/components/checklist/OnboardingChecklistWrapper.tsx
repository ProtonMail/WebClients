import { useEffect } from 'react';

import { isAfter } from 'date-fns';
import { c } from 'ttag';

import { EasySwitchProvider } from '@proton/activation/index';
import { Button } from '@proton/atoms/Button';
import {
    CheckListAccountLogin,
    CheckListGmailForward,
    CheckListMobileStores,
    CheckListProtectInbox,
    useModalState,
} from '@proton/components/components';
import { FeatureCode, GmailSyncModal } from '@proton/components/containers';
import { useActiveBreakpoint, useFeature, useLocalState, useMailSettings, useUser } from '@proton/components/hooks';
import { CHECKLIST_DISPLAY_TYPE, ChecklistKey } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { deleteCheckedItemsForUser } from 'proton-mail/helpers/checklist/checkedItemsStorage';
import { isColumnMode } from 'proton-mail/helpers/mailSettings';

import OnboardingChecklistHeader from './OnboardingChecklistHeader';
import AccountsLoginModal from './modals/AccountsLoginModal';
import MobileAppModal from './modals/MobileAppModal';
import ProtectInboxModal from './modals/ProtectInboxModal';
import StorageRewardModal from './modals/StorageRewardModal';
import OldChecklist from './old/OldChecklist';

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
    const [mailSettings] = useMailSettings();
    const { isNarrow } = useActiveBreakpoint();
    const [user] = useUser();

    const [rewardShowed, setRewardShowed] = useLocalState(false, 'checklist-reward-showed');

    const [gmailForwardProps, setGmailForwardOpen, renderGmailForward] = useModalState();
    const [protectLoginProps, setProtectModalOpen, renderProtectInbox] = useModalState();
    const [loginModalProps, setLoginModalOpen, renderLogin] = useModalState();
    const [mobileAppsProps, setMobileAppsOpen, renderMobileApps] = useModalState();
    const [storageRewardProps, setStorageRewardOpen, renderStorageReward] = useModalState();

    const { items, changeChecklistDisplay, isChecklistFinished, userWasRewarded } = useGetStartedChecklist();

    // This is used to display the reward modal, can only be opened when user is finished and all modals are closed
    const areAllModalsClosed =
        !gmailForwardProps.open && !protectLoginProps.open && !loginModalProps.open && !mobileAppsProps.open;
    const canUserSeeRewardModal = isChecklistFinished && !userWasRewarded && !rewardShowed;
    const canOpenStorageReward = canUserSeeRewardModal && areAllModalsClosed;

    useEffect(() => {
        if (canOpenStorageReward) {
            setStorageRewardOpen(true);
            setRewardShowed(true);
        }
    }, [isChecklistFinished, gmailForwardProps.open, protectLoginProps.open, loginModalProps.open]);

    const handleGmailClose = (hasError?: boolean) => {
        if (!hasError) {
            setGmailForwardOpen(false);
        }
    };

    const handleDismiss = () => {
        // Clean the session storage state
        if (isChecklistFinished) {
            deleteCheckedItemsForUser(user.ID);
        }

        const newState = isChecklistFinished ? CHECKLIST_DISPLAY_TYPE.HIDDEN : CHECKLIST_DISPLAY_TYPE.REDUCED;
        changeChecklistDisplay(newState);
    };

    return (
        <EasySwitchProvider>
            <>
                <div
                    data-testid="onboarding-checklist"
                    className={clsx(
                        'flex flex-column w100',
                        // The checklist is displayed on both the list and details (right side when column mode), we need to hide it on the list when the side details view is visible
                        displayOnMobile && 'free-checklist--container',
                        isColumnMode(mailSettings) && !smallVariant && 'flex-justify-center h100',
                        !smallVariant && 'p-3 md:p-6',
                        !isNarrow && !smallVariant && 'flex-item-centered-vert',
                        smallVariant
                            ? 'mx-2 flex-align-self-end'
                            : 'on-mobile-max-w100 max-w30e px-4 md:px-0 my-3 md:my-0 gap-6'
                    )}
                >
                    <OnboardingChecklistHeader smallVariant={smallVariant} />
                    <ul className={clsx('flex flex-column unstyled my-0', !smallVariant && 'gap-2 md:px-3')}>
                        <li>
                            <CheckListProtectInbox
                                smallVariant={smallVariant}
                                onClick={() => setProtectModalOpen(true)}
                                style={{ borderRadius: smallVariant ? '0.5rem 0.5rem 0 0' : null }}
                                done={items.has(ChecklistKey.ProtectInbox)}
                            />
                        </li>
                        <li>
                            <CheckListGmailForward
                                smallVariant={smallVariant}
                                onClick={() => setGmailForwardOpen(true)}
                                done={items.has(ChecklistKey.Import)}
                            />
                        </li>
                        <li>
                            <CheckListAccountLogin
                                smallVariant={smallVariant}
                                onClick={() => setLoginModalOpen(true)}
                                done={items.has(ChecklistKey.AccountLogin)}
                            />
                        </li>
                        <li>
                            <CheckListMobileStores
                                smallVariant={smallVariant}
                                style={{ borderRadius: smallVariant ? '0 0 0.5rem 0.5rem' : null }}
                                onClick={() => setMobileAppsOpen(true)}
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
                {renderProtectInbox && <ProtectInboxModal {...protectLoginProps} />}
                {renderLogin && <AccountsLoginModal {...loginModalProps} />}
                {renderMobileApps && <MobileAppModal {...mobileAppsProps} />}
                {renderStorageReward && <StorageRewardModal {...storageRewardProps} />}
                {renderGmailForward && (
                    <GmailSyncModal noSkip onSyncCallback={handleGmailClose} {...gmailForwardProps} />
                )}
            </>
        </EasySwitchProvider>
    );
};

const OnboardingChecklistWrapper = (props: Props) => {
    const { feature, loading } = useFeature<boolean>(FeatureCode.NewOnboardingChecklist);
    const { expiresAt } = useGetStartedChecklist();
    if (loading || !feature || isAfter(new Date(), expiresAt)) {
        return null;
    }

    return feature.Value ? <UsersOnboardingChecklist {...props} /> : <OldChecklist {...props} />;
};

export default OnboardingChecklistWrapper;
