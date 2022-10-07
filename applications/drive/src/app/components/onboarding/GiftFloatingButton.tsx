import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { ThemeColorUnion } from '@proton/colors';
import {
    FloatingButton,
    Icon,
    IconName,
    Row,
    Spotlight,
    classnames,
    useActiveBreakpoint,
    useLocalState,
} from '@proton/components';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { ChecklistKey } from '@proton/shared/lib/interfaces';
import spotlightIcon from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

import useActiveShare from '../../hooks/drive/useActiveShare';
import { useFileUploadInput } from '../../store';
import useOpenModal from '../useOpenModal';
import useChecklist from './useChecklist';

export default function GiftFloatingButton() {
    const checklist = useChecklist();
    const { isMobile } = useActiveBreakpoint();

    if (isMobile || checklist.isLoading || checklist.expiresInDays === 0 || !checklist.isVisible) {
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

function WelcomeActionsDoneSpotlight({ onSeen }: { onSeen: () => void }) {
    const [show, setShow] = useState(false);

    // Wait a bit so user can see it opening it up (if opened right away,
    // it might feel as part of the page), and also it allows JS to properly
    // calculate position of the modal when everything is rendered.
    useEffect(() => {
        setTimeout(() => setShow(true), 1000);
    }, []);

    const spotlightContent = (
        <div className="flex flex-nowrap">
            <figure className="flex-item flex-item-noshrink mr1">
                <img src={spotlightIcon} />
            </figure>
            <div className="flex-item">
                <h6 className="text-semibold">{c('Title').t`You’ve got 1 GB of storage`}</h6>
                <div className="mb1 color-weak">{c('Info').t`Way to go, you’ve just doubled your free storage!`}</div>
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
            <figure className="flex-item flex-item-noshrink mr1">
                <img src={spotlightIcon} />
            </figure>
            <div className="flex-item">
                <h6 className="text-semibold">{c('Title').t`Your 500 MB bonus`}</h6>
                {/* translator: You have X days left to claim your 500 MB welcome bonus and double your storage */}
                {c('Info').t`You have ${expiresInDays} days left to claim your 500 MB welcome bonus and `}
                <a href={getKnowledgeBaseUrl('/more-storage-proton-drive')} target="_blank">{c('Info')
                    .t`double your storage`}</a>
            </div>
        </div>
    ) : (
        <div>
            <h6 className="text-semibold">{c('Title').t`Your welcome actions`}</h6>
            <div className="mb1 color-weak">
                {c('Info').t`Get to know Proton Drive and earn your 500 MB storage bonus! Take action today.`}
            </div>
            <WelcomeActions completedActions={completedActions} onActionDone={toggleOpen} />
        </div>
    );
    return (
        <FloatingSpotlight
            content={spotlightContent}
            hasClose={showPopup}
            show={showPopup || showList}
            onClick={toggleOpen}
            color={showList ? 'weak' : 'norm'}
            icon={showList ? 'cross' : 'gift'}
        />
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
            originalPlacement="top-right"
            className="max-w-custom upper-layer"
            style={{ '--max-width-custom': '25em' }}
            hasClose={hasClose}
        >
            <FloatingButton
                title={c('Action').t`Your 500 MB bonus`}
                onClick={onClick}
                color={color}
                className="w-custom h-custom"
                style={{ '--width-custom': '3em', '--height-custom': '3em' }}
            >
                <Icon size={24} name={icon} className="mauto" />
            </FloatingButton>
        </Spotlight>
    );
}

function WelcomeActions({
    completedActions,
    onActionDone,
}: {
    completedActions: ChecklistKey[];
    onActionDone: () => void;
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

    const { openFileSharing } = useOpenModal();

    return (
        <>
            <WelcomeAction icon="checkmark" title={c('Label').t`Create Proton account`} />
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
                    openFileSharing(activeFolder.shareId);
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
                    window.open(getAppHref(url, APPS.PROTONACCOUNT));
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
            className={classnames(['flex flex-align-items-center rounded', !isDone && 'cursor-pointer'])}
            onClick={isDone ? undefined : action}
            onMouseEnter={() => setOnHover(true)}
            onMouseLeave={() => setOnHover(false)}
        >
            <div
                className={classnames([
                    'flex-item-nowrap h-custom w-custom rounded mr0-5',
                    'flex flex-justify-center flex-align-items-center',
                    isDone ? 'bg-success' : 'bg-weak',
                ])}
                style={{ '--width-custom': '2.5em', '--height-custom': '2.5em' }}
            >
                <Icon name={icon} />
            </div>
            <div className={classnames(['flex-item-fluid', isDone && 'text-strike color-weak'])}>
                {title}
                {!isDone && text && <div className="color-weak">{text}</div>}
            </div>
            {!isDone && (
                <Icon name={onHover ? 'arrow-right' : 'chevron-right'} className={onHover ? '' : 'color-weak'} />
            )}
        </Row>
    );
}
