import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import type { ThemeColorUnion } from '@proton/colors';
import {
    FloatingButton,
    Icon,
    Row,
    Spotlight,
    useActiveBreakpoint,
    useAuthentication,
    useLocalState,
} from '@proton/components';
import type { IconName } from '@proton/icons/types';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS, BRAND_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { ChecklistKey } from '@proton/shared/lib/interfaces';
import spotlightIcon from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';
import clsx from '@proton/utils/clsx';

import { useIsFreeUploadInProgress } from '../../hooks/drive/freeUpload/useIsFreeUploadInProgress';
import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { useSharingModal } from '../../modals/SharingModal/SharingModal';
import { useFileUploadInput } from '../../store';
import { useFileSharingModal } from '../modals/SelectLinkToShareModal/SelectLinkToShareModal';
import useChecklist from './useChecklist';

import './GiftFloatingButton.scss';

export default function GiftFloatingButton() {
    const checklist = useChecklist();
    const { viewportWidth } = useActiveBreakpoint();
    const isFreeUploadInProgress = useIsFreeUploadInProgress();

    if (
        isFreeUploadInProgress ||
        viewportWidth['<=small'] ||
        checklist.isLoading ||
        checklist.expiresInDays === 0 ||
        !checklist.isVisible
    ) {
        return null;
    }

    if (checklist.isCompleted) {
        return <WelcomeActionsDoneSpotlight onSeen={checklist.markCompletedAsSeen} />;
    }

    return (
        <WelcomeActionsSpotlight
            reloadChecklist={checklist.reload}
            completedActions={checklist.completedActions}
            expiresInDays={checklist.expiresInDays}
        />
    );
}

function WelcomeActionsDoneSpotlight({ onSeen }: { onSeen: (dismiss?: boolean) => void }) {
    const [show, setShow] = useState(false);

    // Wait a bit so user can see it opening it up (if opened right away,
    // it might feel as part of the page), and also it allows JS to properly
    // calculate position of the modal when everything is rendered.
    useEffect(() => {
        setTimeout(() => {
            setShow(true);
            // Product wants to mark it seen on backend automatically.
            onSeen(false);
        }, 1000);
    }, []);

    const spotlightContent = (
        <div className="flex flex-nowrap">
            <figure className="shrink-0 mr-4">
                <img src={spotlightIcon} alt="" />
            </figure>
            <div>
                <h6 className="text-semibold">{c('Title').t`You’ve got 5 GB of storage`}</h6>
                <div className="mb-4 color-weak">{c('Info')
                    .t`Way to go, you've just increased your storage to 5 GB!`}</div>
            </div>
        </div>
    );

    return (
        <FloatingSpotlight content={spotlightContent} show={show} onClick={onSeen} color="success" icon="checkmark" />
    );
}

function WelcomeActionsSpotlight({
    reloadChecklist,
    completedActions,
    expiresInDays,
}: {
    reloadChecklist: () => void;
    completedActions: ChecklistKey[];
    expiresInDays: number;
}) {
    const [showPopup, setShowPopup] = useLocalState(true, 'welcome-actions-spotlight');
    const [showList, setShowList] = useState(false);
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const { sharingModal, showSharingModal } = useSharingModal();

    const toggleOpen = () => {
        setShowPopup(false); // Any click will remove automatic popup.
        setShowList(!showList);
        // Load latest progress before opening checklist again os user doesnt
        // need to reload the whole page.
        if (!showList) {
            reloadChecklist();
        }
    };

    const spotlightContent = showPopup ? (
        <div className="flex flex-nowrap">
            <figure className="shrink-0 mr-4">
                <img src={spotlightIcon} alt="" />
            </figure>
            <div>
                <h6 className="text-semibold">{c('Title').t`Your 3 GB bonus`}</h6>
                {/* translator: You have X days left to claim your 3 GB welcome bonus and upgrade your storage */}
                {c('Info').ngettext(
                    msgid`You have ${expiresInDays} day left to claim your 3 GB welcome bonus and `,
                    `You have ${expiresInDays} days left to claim your 3 GB welcome bonus and `,
                    expiresInDays
                )}
                <a href={getKnowledgeBaseUrl('/more-storage-proton-drive')} target="_blank">{c('Info')
                    .t`upgrade your storage`}</a>
            </div>
        </div>
    ) : (
        <div>
            <h6 className="text-semibold">{c('Title').t`Your welcome actions`}</h6>
            <div className="mb-4 pr-4 color-weak">
                {c('Info').t`Get to know ${DRIVE_APP_NAME} and earn your 3 GB storage bonus! Take action today.`}
            </div>
            <WelcomeActions
                completedActions={completedActions}
                onActionDone={toggleOpen}
                showFileSharingModal={showFileSharingModal}
                showSharingModal={showSharingModal}
            />
        </div>
    );
    return (
        <>
            <FloatingSpotlight
                content={spotlightContent}
                hasClose={showPopup}
                show={showPopup || showList}
                onClick={toggleOpen}
                color={showList ? 'weak' : 'norm'}
                icon={showList ? 'cross' : 'gift'}
            />
            {fileSharingModal}
            {sharingModal}
        </>
    );
}

function FloatingSpotlight({
    content,
    show,
    color,
    icon,
    hasClose = false,
    onClick,
}: {
    content: React.ReactNode;
    show: boolean;
    color: ThemeColorUnion;
    icon: IconName;
    hasClose?: boolean;
    onClick: () => void;
}) {
    return (
        <Spotlight
            content={content}
            show={show}
            originalPlacement="top-end"
            className="max-w-custom z-up"
            style={{ '--max-w-custom': '25em' }}
            hasClose={hasClose}
        >
            <FloatingButton
                // Only way to override fab classes
                id="gift-floating-button"
                title={c('Action').t`Your 3 GB bonus`}
                onClick={onClick}
                color={color}
                data-testid="gift-floating-button"
            >
                <Icon size={5} name={icon} className="m-auto" />
            </FloatingButton>
        </Spotlight>
    );
}

function WelcomeActions({
    completedActions,
    onActionDone,
    showFileSharingModal,
    showSharingModal,
}: {
    completedActions: ChecklistKey[];
    onActionDone: () => void;
    showFileSharingModal: ReturnType<typeof useFileSharingModal>[1];
    showSharingModal: ReturnType<typeof useSharingModal>['showSharingModal'];
}) {
    const getIconName = (actionName: ChecklistKey, iconName: IconName) => {
        return completedActions.includes(actionName) ? 'checkmark' : iconName;
    };

    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange: handleFileChange,
    } = useFileUploadInput(activeFolder.volumeId, activeFolder.shareId, activeFolder.linkId);
    const { getLocalID } = useAuthentication();

    return (
        <>
            <WelcomeAction icon="checkmark" title={c('Label').t`Create ${BRAND_NAME} account`} />
            <input
                multiple
                type="file"
                ref={fileInput}
                className="hidden"
                onChange={(e) => {
                    void handleFileChange(e);
                    onActionDone();
                }}
            />
            <WelcomeAction
                icon={getIconName(ChecklistKey.DriveUpload, 'arrow-up-line')}
                title={c('Label').t`Upload your first file`}
                text={c('Info').t`And access it from anywhere`}
                action={() => {
                    handleClick();
                }}
            />
            <WelcomeAction
                icon={getIconName(ChecklistKey.DriveShare, 'user-plus')}
                title={c('Label').t`Share a file, folder, or album`}
                text={c('Info').t`It’s easy and secure`}
                action={() => {
                    void showFileSharingModal({ shareId: activeFolder.shareId, showSharingModal });
                    onActionDone();
                }}
            />
            <WelcomeAction
                icon={getIconName(ChecklistKey.RecoveryMethod, 'key-skeleton')}
                title={c('Label').t`Set recovery method`}
                text={c('Info').t`Makes your account safer`}
                action={() => {
                    const slug = getSlugFromApp(APPS.PROTONDRIVE);
                    const url = `/${slug}/recovery`;
                    window.open(getAppHref(url, APPS.PROTONACCOUNT, getLocalID()));
                    onActionDone();
                }}
            />
        </>
    );
}

function WelcomeAction({
    icon,
    title,
    text,
    action,
}: {
    icon: IconName;
    title: string;
    text?: string;
    action?: () => void;
}) {
    const [onHover, setOnHover] = useState(false);

    const isDone = icon === 'checkmark';

    return (
        <Row
            className={clsx(['flex items-center rounded', !isDone && 'cursor-pointer'])}
            onClick={isDone ? undefined : action}
            onMouseEnter={() => setOnHover(true)}
            onMouseLeave={() => setOnHover(false)}
            data-testid="welcome-actions"
        >
            <div
                className={clsx([
                    'h-custom w-custom rounded mr-2',
                    'flex justify-center items-center',
                    isDone ? 'bg-success' : 'bg-weak',
                ])}
                style={{ '--w-custom': '2.5em', '--h-custom': '2.5em' }}
                data-testid="welcome-actions-icons"
            >
                <Icon name={icon} />
            </div>
            <div className={clsx(['flex-1', isDone && 'text-strike color-weak'])} data-testid="welcome-actions-text">
                {title}
                {!isDone && text && <div className="color-weak">{text}</div>}
            </div>
            {!isDone && (
                <Icon name={onHover ? 'arrow-right' : 'chevron-right'} className={onHover ? '' : 'color-weak'} />
            )}
        </Row>
    );
}
