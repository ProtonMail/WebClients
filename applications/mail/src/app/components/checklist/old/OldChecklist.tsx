import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    Icon,
    OldCheckListImportMail,
    OldCheckListMobileStores,
    OldCheckListRecoveryMethod,
    OldCheckListSendMessage,
    useModalState,
    useSettingsLink,
} from '@proton/components/components';
import { useActiveBreakpoint, useIsMnemonicAvailable, useMailSettings, useUser } from '@proton/components/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { CHECKLIST_DISPLAY_TYPE, ChecklistKey } from '@proton/shared/lib/interfaces';
import { MNEMONIC_STATUS, UserModel } from '@proton/shared/lib/interfaces/User';
import clsx from '@proton/utils/clsx';

import { MESSAGE_ACTIONS } from 'proton-mail/constants';
import { useOnCompose } from 'proton-mail/containers/ComposeProvider';
import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { isColumnMode } from 'proton-mail/helpers/mailSettings';
import { ComposeTypes } from 'proton-mail/hooks/composer/useCompose';

import MobileAppModal from '../modals/MobileAppModal';
import StorageRewardModal from '../modals/StorageRewardModal';
import MnemonicPromptModal from './MnemonicPromptModal';
import ModalImportEmails from './ModalImportEmails';

interface Props {
    smallVariant?: boolean;
    hideDismissButton?: boolean;
    displayOnMobile?: boolean;
    customText?: string;
    reduceSpace?: boolean;
}

const getCanReactiveMnemonic = (user: UserModel) => {
    return (
        user.MnemonicStatus === MNEMONIC_STATUS.PROMPT ||
        user.MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
        user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED
    );
};

const OldChecklist = ({ smallVariant = false, displayOnMobile = false, hideDismissButton }: Props) => {
    const [user] = useUser();
    const [mailSettings] = useMailSettings();
    const onCompose = useOnCompose();
    const goToSettings = useSettingsLink();
    const { isNarrow } = useActiveBreakpoint();

    const [rewardShowed, setRewardShowed] = useState(false);

    const [isMnemonicAvailable] = useIsMnemonicAvailable();
    const canReactivateMnemonic = getCanReactiveMnemonic(user);
    const displayMnemonicPrompt = isMnemonicAvailable && canReactivateMnemonic;

    const [importMailProps, setImportMailOpen, renderImportMail] = useModalState();
    const [mobileAppsProps, setMobileAppsOpen, renderMobileApps] = useModalState();
    const [recoveryMethodProps, setRecoveryMethodOpen, renderRecoveryMethod] = useModalState();
    const [storageRewardProps, setStorageRewardOpen, renderStorageReward] = useModalState();

    const { isUserPaid, items, changeChecklistDisplay, isChecklistFinished, userWasRewarded } =
        useGetStartedChecklist();
    const canOpenStorageReward =
        isChecklistFinished &&
        !userWasRewarded &&
        !rewardShowed &&
        !isUserPaid &&
        !importMailProps.open &&
        !mobileAppsProps.open &&
        !recoveryMethodProps.open;

    useEffect(() => {
        if (canOpenStorageReward) {
            setStorageRewardOpen(true);
            setRewardShowed(true);
        }
    }, [isChecklistFinished, importMailProps.open, mobileAppsProps.open, recoveryMethodProps.open]);

    const handleMnemonicClick = () => {
        if (displayMnemonicPrompt) {
            setRecoveryMethodOpen(true);
        } else {
            goToSettings('/recovery', undefined, true);
        }
    };

    const handleDismiss = () => {
        const newState = isChecklistFinished ? CHECKLIST_DISPLAY_TYPE.HIDDEN : CHECKLIST_DISPLAY_TYPE.REDUCED;
        changeChecklistDisplay(newState);
    };

    return (
        <>
            <div
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
                {smallVariant ? (
                    <div className="flex flex-justify-space-between text-sm px-3">
                        <p className="m-0 mb-2">{c('Get started checklist instructions')
                            .t`Make ${BRAND_NAME} your go-to inbox`}</p>
                        <Icon
                            name="cross"
                            className="cursor-pointer"
                            onClick={() => changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.HIDDEN)}
                        />
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="m-0 mb-1 text-lg text-bold lh130">{c('Get started checklist instructions')
                            .t`Protect and simplify your email`}</p>
                        {!isUserPaid && (
                            <p className="m-0 color-weak w-2/3 m-auto">{c('Get started checklist instructions')
                                .t`Double your free storage to 1 GB when you complete the following:`}</p>
                        )}
                    </div>
                )}

                <div className={clsx('flex flex-column', !smallVariant && 'gap-2 md:px-3')}>
                    <OldCheckListImportMail
                        smallVariant={smallVariant}
                        done={items.has(ChecklistKey.Import)}
                        onClick={() => setImportMailOpen(true)}
                    />
                    <OldCheckListSendMessage
                        smallVariant={smallVariant}
                        done={items.has(ChecklistKey.SendMessage)}
                        onClick={() => {
                            onCompose({
                                type: ComposeTypes.newMessage,
                                action: MESSAGE_ACTIONS.NEW,
                            });
                        }}
                    />
                    <OldCheckListMobileStores
                        smallVariant={smallVariant}
                        style={{ borderRadius: smallVariant ? '0 0 0.5rem 0.5rem' : null }}
                        done={items.has(ChecklistKey.MobileApp)}
                        onClick={() => setMobileAppsOpen(true)}
                    />
                    <OldCheckListRecoveryMethod
                        smallVariant={smallVariant}
                        done={items.has(ChecklistKey.RecoveryMethod)}
                        onClick={handleMnemonicClick}
                    />
                </div>
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

            {renderImportMail && <ModalImportEmails {...importMailProps} />}
            {renderMobileApps && <MobileAppModal {...mobileAppsProps} />}
            {renderRecoveryMethod && <MnemonicPromptModal {...recoveryMethodProps} />}
            {renderStorageReward && <StorageRewardModal {...storageRewardProps} />}
        </>
    );
};

export default OldChecklist;
