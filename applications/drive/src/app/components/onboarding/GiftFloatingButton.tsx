import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { ThemeColorUnion } from '@proton/colors';
import {
    FloatingButton,
    Icon,
    IconName,
    Row,
    Spotlight,
    useActiveBreakpoint,
    useAuthentication,
    useDrawerWidth,
    useLocalState,
} from '@proton/components';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS, BRAND_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { ChecklistKey } from '@proton/shared/lib/interfaces';
import spotlightIcon from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';
import clsx from '@proton/utils/clsx';

import useActiveShare from '../../hooks/drive/useActiveShare';
import { useFileUploadInput } from '../../store';
import { useFileSharingModal } from '../modals/SelectLinkToShareModal/SelectLinkToShareModal';
import { useLinkSharingModal } from '../modals/ShareLinkModal/ShareLinkModal';
import useChecklist from './useChecklist';

export default function GiftFloatingButton() {
    const checklist = useChecklist();
    const { isNarrow } = useActiveBreakpoint();

    if (isNarrow || checklist.isLoading || checklist.expiresInDays === 0 || !checklist.isVisible) {
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
            <figure className="flex-item flex-item-noshrink mr-4">
                <img src={spotlightIcon} alt="" />
            </figure>
            <div className="flex-item">
                <h6 className="text-semibold">{c('Title').t`You’ve got 1 GB of storage`}</h6>
                <div className="mb-4 color-weak">{c('Info').t`Way to go, you’ve just doubled your free storage!`}</div>
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
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

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
            <figure className="flex-item flex-item-noshrink mr-4">
                <img src={spotlightIcon} alt="" />
            </figure>
            <div className="flex-item">
                <h6 className="text-semibold">{c('Title').t`Your 500 MB bonus`}</h6>
                {/* translator: You have X days left to claim your 500 MB welcome bonus and double your storage */}
                {c('Info').ngettext(
                    msgid`You have ${expiresInDays} day left to claim your 500 MB welcome bonus and `,
                    `You have ${expiresInDays} days left to claim your 500 MB welcome bonus and `,
                    expiresInDays
                )}
                <a href={getKnowledgeBaseUrl('/more-storage-proton-drive')} target="_blank">{c('Info')
                    .t`double your storage`}</a>
            </div>
        </div>
    ) : (
        <div>
            <h6 className="text-semibold">{c('Title').t`Your welcome actions`}</h6>
            <div className="mb-4 color-weak">
                {c('Info').t`Get to know ${DRIVE_APP_NAME} and earn your 500 MB storage bonus! Take action today.`}
            </div>
            <WelcomeActions
                completedActions={completedActions}
                onActionDone={toggleOpen}
                showFileSharingModal={showFileSharingModal}
                showLinkSharingModal={showLinkSharingModal}
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
            {linkSharingModal}
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
    const drawerWidth = useDrawerWidth();
    // 1.6 is the default right offset on the floating button. Adding to that space that the drawer is taking
    const rightOffset = drawerWidth / rootFontSize() + 1.6;

    return (
        <Spotlight
            content={content}
            show={show}
            originalPlacement="top-end"
            className="max-w-custom upper-layer"
            style={{ '--max-w-custom': '25em' }}
            hasClose={hasClose}
        >
            <FloatingButton
                title={c('Action').t`Your 500 MB bonus`}
                onClick={onClick}
                color={color}
                className="w-custom h-custom"
                style={{ '--w-custom': '3em', '--h-custom': '3em', '--right': `${rightOffset}rem` }}
            >
                <Icon size={24} name={icon} className="m-auto" />
            </FloatingButton>
        </Spotlight>
    );
}

function WelcomeActions({
    completedActions,
    onActionDone,
    showFileSharingModal,
    showLinkSharingModal,
}: {
    completedActions: ChecklistKey[];
    onActionDone: () => void;
    showFileSharingModal: ReturnType<typeof useFileSharingModal>[1];
    showLinkSharingModal: ReturnType<typeof useLinkSharingModal>[1];
}) {
    const getIconName = (actionName: ChecklistKey, iconName: IconName) => {
        return completedActions.includes(actionName) ? 'checkmark' : iconName;
    };

    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange: handleFileChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);
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
                    handleFileChange(e);
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
                icon={getIconName(ChecklistKey.DriveShare, 'link')}
                title={c('Label').t`Create a share link`}
                text={c('Info').t`It’s easy and secure`}
                action={() => {
                    void showFileSharingModal({ shareId: activeFolder.shareId, showLinkSharingModal });
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
            className={clsx(['flex flex-align-items-center rounded', !isDone && 'cursor-pointer'])}
            onClick={isDone ? undefined : action}
            onMouseEnter={() => setOnHover(true)}
            onMouseLeave={() => setOnHover(false)}
        >
            <div
                className={clsx([
                    'flex-item-nowrap h-custom w-custom rounded mr-2',
                    'flex flex-justify-center flex-align-items-center',
                    isDone ? 'bg-success' : 'bg-weak',
                ])}
                style={{ '--w-custom': '2.5em', '--h-custom': '2.5em' }}
            >
                <Icon name={icon} />
            </div>
            <div className={clsx(['flex-item-fluid', isDone && 'text-strike color-weak'])}>
                {title}
                {!isDone && text && <div className="color-weak">{text}</div>}
            </div>
            {!isDone && (
                <Icon name={onHover ? 'arrow-right' : 'chevron-right'} className={onHover ? '' : 'color-weak'} />
            )}
        </Row>
    );
}
