import { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import lumoHardHat from '@proton/styles/assets/img/lumo/lumo-hard-hat.svg';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    useModalStateObject,
    usePopperAnchor,
} from '@proton/components';
import useApi from '@proton/components/hooks/useApi';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { DragAreaProvider } from '../../providers/DragAreaProvider';
import { PandocProvider } from '../../providers/PandocProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { WebSearchProvider } from '../../providers/WebSearchProvider';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectAttachmentsBySpaceId, selectConversationsBySpaceId, selectProvisionalAttachments, selectSpaceById } from '../../redux/selectors';
import { sendMessage } from '../interactiveConversation/helper';
import { pushAttachmentRequest, upsertAttachment } from '../../redux/slices/core/attachments';
import { ComposerComponent } from '../interactiveConversation/composer/ComposerComponent';
import { FilesManagementView } from '../components/Files/KnowledgeBase/FilesManagementView';
import { HeaderWrapper } from '../header/HeaderWrapper';
import { getProjectCategory, getPromptSuggestionsForCategory } from './constants';
import { useProjectActions } from './hooks/useProjectActions';
import { ProjectFilesPanel } from './ProjectFilesPanel';
import { DeleteProjectModal } from './modals/DeleteProjectModal';
import { ProjectInstructionsModal } from './modals/ProjectInstructionsModal';
import type { Project } from './types';

import './ProjectDetailView.scss';

interface RouteParams {
    projectId: string;
}

const ProjectDetailViewInner = () => {
    const { projectId } = useParams<RouteParams>();
    const history = useHistory();
    const dispatch = useLumoDispatch();
    const api = useApi();
    const [showSidebar, setShowSidebar] = useState(true);
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [, setIsEditorEmpty] = useState(true);
    const [isProcessingAttachment] = useState(false);
    const [suggestedPrompt, setSuggestedPrompt] = useState<string | undefined>(undefined);
    const instructionsModal = useModalStateObject();
    const deleteModal = useModalStateObject();
    const sidebarModal = useModalStateObject();
    const driveBrowserModal = useModalStateObject();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const space = useLumoSelector((state) => selectSpaceById(projectId)(state));
    const conversations = useLumoSelector((state) => selectConversationsBySpaceId(projectId)(state));
    const allConversations = Object.values(conversations);

    // Sort conversations by date (most recent first)
    const sortedConversations = [...allConversations].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Group conversations by date sections
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const todayConversations: typeof sortedConversations = [];
    const last7DaysConversations: typeof sortedConversations = [];
    const olderConversations: typeof sortedConversations = [];

    sortedConversations.forEach((conversation) => {
        const createdAt = new Date(conversation.createdAt);
        const conversationDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
        const conversationTime = conversationDate.getTime();
        const todayTime = todayStart.getTime();
        const sevenDaysAgoTime = sevenDaysAgo.getTime();

        if (conversationTime === todayTime) {
            todayConversations.push(conversation);
        } else if (conversationTime >= sevenDaysAgoTime) {
            last7DaysConversations.push(conversation);
        } else {
            olderConversations.push(conversation);
        }
    });

    const spaceAttachments = useLumoSelector((state) => selectAttachmentsBySpaceId(projectId)(state));
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const { isSmallScreen } = useSidebar();
    const [isMobileViewport, setIsMobileViewport] = useState(false);

    // Check if viewport is <= 768px (matches CSS breakpoint for mobile-specific UI)
    useEffect(() => {
        const checkViewport = () => {
            setIsMobileViewport(window.innerWidth <= 768);
        };
        checkViewport();
        window.addEventListener('resize', checkViewport);
        return () => window.removeEventListener('resize', checkViewport);
    }, []);

    // Automatically hide sidebar on mobile to prevent CSS layout issues
    useEffect(() => {
        if (isMobileViewport) {
            setShowSidebar(false);
        }
    }, [isMobileViewport]);

    const { createConversationInProject, deleteProject } = useProjectActions();

    const handleShowDriveBrowser = useCallback(() => {
        // Show Drive browser in a modal
        driveBrowserModal.openModal(true);
    }, [driveBrowserModal]);

    const handleSendInProject = useCallback(
        async (content: string) => {
            try {
                if (!content.trim()) {
                    console.log('Empty content, skipping send');
                    return;
                }

                console.log('Creating conversation in project:', projectId);
                // Create a new conversation in this project
                const conversationId = createConversationInProject(projectId);
                console.log('Created conversation:', conversationId);

                // Assign provisional attachments to the space
                // This makes them permanent space-level attachments
                if (provisionalAttachments.length > 0) {
                    console.log('Assigning attachments to space:', provisionalAttachments);
                    provisionalAttachments.forEach((attachment) => {
                        dispatch(upsertAttachment({ ...attachment, spaceId: projectId }));
                        // Now that the attachment has a spaceId, push it to the server
                        dispatch(pushAttachmentRequest({ id: attachment.id }));
                    });
                }

                // Navigate to the conversation first
                history.push(`/c/${conversationId}`);

                // Send the message using the helper function
                // sendMessage returns a thunk, so we need to dispatch it
                console.log('Sending message...');
                await dispatch(
                    sendMessage({
                        api,
                        newMessageContent: content,
                        attachments: provisionalAttachments,
                        messageChain: [],
                        conversationId,
                        spaceId: projectId,
                        signal: new AbortController().signal,
                        navigateCallback: (newConvId) => {
                            console.log('Navigate callback:', newConvId);
                            history.push(`/c/${newConvId}`);
                        },
                        enableExternalToolsToggled: false,
                    })
                );
                console.log('Message sent successfully');
            } catch (error) {
                console.error('Error in handleSendInProject:', error);
                throw error; // Re-throw to see it in error boundary
            }
        },
        [api, dispatch, projectId, provisionalAttachments, createConversationInProject, history]
    );

    if (!space || !space.isProject) {
        return (
            <div className="project-detail-not-found flex flex-column items-center justify-center">
                <Icon name="exclamation-circle" size={4} />
                <h2 className="text-lg">{c('collider_2025:Error').t`Project not found`}</h2>
                <Button onClick={() => history.push('/projects')}>
                    {c('collider_2025:Button').t`Back to projects`}
                </Button>
            </div>
        );
    }

    const projectName = space.projectName || 'Untitled Project';
    const projectInstructions = space.projectInstructions || '';
    const category = getProjectCategory(space.projectIcon);

    // Count files for this space
    const fileCount = Object.values(spaceAttachments).filter(
        (att) => !att.error
    ).length;

    // Get prompt suggestions based on project category (only shown when no conversations exist)
    const promptSuggestions = sortedConversations.length === 0
        ? getPromptSuggestionsForCategory(category.id)
        : [];

    // Create a Project object for the delete modal
    const projectForModal: Project = {
        id: projectId,
        name: projectName,
        description: projectInstructions,
        fileCount,
        conversationCount: sortedConversations.length,
        spaceId: projectId,
    };

    const handleDelete = () => {
        deleteProject(projectId);
    };

    return (
        <div className="project-detail-view flex flex-column">
            {isSmallScreen && (
                <HeaderWrapper>
                    <>
                    </>
                </HeaderWrapper>
            )}
            <div className={`project-detail-header flex flex-nowrap items-baseline ${showSidebar ? 'with-sidebar' : 'without-sidebar'}`}>
                <div className="project-detail-header-content flex flex-column">

                        <Button
                            icon
                            shape="ghost"
                            onClick={() => history.push('/projects')}
                            className="project-detail-back-button flex items-center text-sm"
                            title={c('collider_2025:Action').t`Back to projects`}
                        >
                            <Icon name="arrow-left" className="mr-1" />
                            <span className="project-detail-back-text">{c('collider_2025:Navigation').t`All projects`}</span>
                        </Button>

                    <div className="project-detail-title-section flex items-center">
                        <Icon name={category.icon as any} size={6} className="project-detail-title-icon shrink-0" />
                        <h1 className="project-detail-title text-2xl">{projectName}</h1>
                    </div>
                    {isMobileViewport && (
                        <div className="project-detail-actions-mobile flex items-end">
                            <Button
                                shape="ghost"
                                onClick={() => {
                                    sidebarModal.openModal(true);
                                }}
                                title={c('collider_2025:Action').t`Show instructions and files`}
                                className="project-detail-settings-button flex items-center"
                            >
                                <Icon name="list-bullets" className="mr-1" />
                                <span>
                                    {c('collider_2025:Action').t`Show settings`}
                                </span>
                            </Button>
                            <Button
                                ref={anchorRef}
                                icon
                                shape="ghost"
                                onClick={toggle}
                                title={c('collider_2025:Action').t`More options`}
                            >
                                <Icon name="three-dots-vertical" />
                            </Button>
                            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                                <DropdownMenu>
                                    <DropdownMenuButton
                                        className="text-left color-danger"
                                        onClick={() => {
                                            close();
                                            deleteModal.openModal(true);
                                        }}
                                    >
                                        <Icon name="trash" className="mr-2" />
                                        {c('collider_2025:Action').t`Delete project`}
                                    </DropdownMenuButton>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    )}
                </div>
                {!isMobileViewport && (
                    <div className="project-detail-actions flex items-end">
                    <Button
                        shape="ghost"
                        onClick={() => {
                            if (isMobileViewport) {
                                sidebarModal.openModal(true);
                            } else {
                                setShowSidebar(!showSidebar);
                            }
                        }}
                        title={
                            isMobileViewport
                                ? c('collider_2025:Action').t`Show instructions and files`
                                : showSidebar
                                ? c('collider_2025:Action').t`Hide sidebar`
                                : c('collider_2025:Action').t`Show sidebar`
                        }
                        className="project-detail-settings-button flex items-center"
                    >
                        <Icon name={isMobileViewport ? 'list-bullets' : showSidebar ? 'chevron-right' : 'meet-settings'} className="mr-1" />
                        <span>
                            {showSidebar ?
                                c('collider_2025:Action').t`Hide settings`
                                : c('collider_2025:Action').t`Show settings`
                            }
                        </span>
                    </Button>
                    <Button
                        ref={anchorRef}
                        icon
                        shape="ghost"
                        onClick={toggle}
                        title={c('collider_2025:Action').t`More options`}
                    >
                        <Icon name="three-dots-vertical" />
                    </Button>
                    <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                        <DropdownMenu>
                            <DropdownMenuButton
                                className="text-left color-danger"
                                onClick={() => {
                                    close();
                                    deleteModal.openModal(true);
                                }}
                            >
                                <Icon name="trash" className="mr-2" />
                                {c('collider_2025:Action').t`Delete project`}
                            </DropdownMenuButton>
                        </DropdownMenu>
                    </Dropdown>
                    </div>
                )}
            </div>

            <div className={`project-detail-content flex flex-row flex-nowrap flex-1 relative overflow-hidden ${showSidebar ? 'with-sidebar' : 'without-sidebar'}`}>
                {/* Main area - similar to 'outer' in lumo-chat-container */}
                <div className="outer flex flex-column flex-nowrap flex-1">
                    <div className="project-detail-main flex flex-column justify-center items-center">
                    {sortedConversations.length === 0 ? (
                        <div className="project-detail-empty flex flex-column items-center justify-center flex-1">
                            <img src={lumoHardHat} alt="Projects" width={80} />
                            <h2 className="project-detail-empty-title text-lg pt-3">
                                {c('collider_2025:Title').t`Start a new project conversation`}
                            </h2>
                            {promptSuggestions.length > 0 && (
                                <div className="project-detail-prompt-suggestions flex flex-column">
                                    {promptSuggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            className="project-detail-prompt-suggestion text-sm"
                                            onClick={() => setSuggestedPrompt(suggestion)}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="project-detail-conversations flex flex-column pt-5">
                            <div className="project-detail-conversation-list flex flex-column">
                                {todayConversations.length > 0 && (
                                    <>
                                        <h3 className="project-detail-section-title text-sm">
                                            {c('collider_2025:Title').t`Today`}
                                        </h3>
                                        {todayConversations.map((conversation) => {
                                            const createdAt = new Date(conversation.createdAt);
                                            const formattedDate = createdAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

                                            return (
                                                <button
                                                    key={conversation.id}
                                                    className="project-detail-conversation-item flex items-center"
                                                    onClick={() => history.push(`/c/${conversation.id}`)}
                                                >
                                                    <div className="project-detail-conversation-content flex flex-column flex-1">
                                                        <span className="project-detail-conversation-title text-md">
                                                            {conversation.title || c('collider_2025:Label').t`Untitled chat`}
                                                        </span>
                                                        <span className="project-detail-conversation-date text-xs">
                                                            {formattedDate}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </>
                                )}

                                {last7DaysConversations.length > 0 && (
                                    <>
                                        <h3 className="project-detail-section-title text-sm">
                                            {c('collider_2025:Title').t`Last 7 days`}
                                        </h3>
                                        {last7DaysConversations.map((conversation) => {
                                            const createdAt = new Date(conversation.createdAt);
                                            const formattedDate = createdAt.toLocaleDateString([], { month: 'short', day: 'numeric' });

                                            return (
                                                <button
                                                    key={conversation.id}
                                                    className="project-detail-conversation-item flex items-center"
                                                    onClick={() => history.push(`/c/${conversation.id}`)}
                                                >
                                                    <div className="project-detail-conversation-content flex flex-column flex-1">
                                                        <span className="project-detail-conversation-title text-md">
                                                            {conversation.title || c('collider_2025:Label').t`Untitled chat`}
                                                        </span>
                                                        <span className="project-detail-conversation-date text-xs">
                                                            {formattedDate}
                                                        </span>
                                                    </div>
                                                    <Icon name="arrow-right" size={3} className="project-detail-conversation-arrow shrink-0" />
                                                </button>
                                            );
                                        })}
                                    </>
                                )}

                                {olderConversations.length > 0 && (
                                    <>
                                        <h3 className="project-detail-section-title text-sm">
                                            {c('collider_2025:Title').t`Older`}
                                        </h3>
                                        {olderConversations.map((conversation) => {
                                            const createdAt = new Date(conversation.createdAt);
                                            const formattedDate = createdAt.toLocaleDateString([], { month: 'short', day: 'numeric' });

                                            return (
                                                <button
                                                    key={conversation.id}
                                                    className="project-detail-conversation-item flex items-center"
                                                    onClick={() => history.push(`/c/${conversation.id}`)}
                                                >
                                                    <div className="project-detail-conversation-content flex flex-column flex-1">
                                                        <span className="project-detail-conversation-title text-md">
                                                            {conversation.title || c('collider_2025:Label').t`Untitled chat`}
                                                        </span>
                                                        <span className="project-detail-conversation-date text-xs">
                                                            {formattedDate}
                                                        </span>
                                                    </div>
                                                    <Icon name="arrow-right" size={3} className="project-detail-conversation-arrow shrink-0" />
                                                </button>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="project-detail-composer flex flex-column items-center">
                        <ComposerComponent
                            handleSendMessage={handleSendInProject}
                            isProcessingAttachment={isProcessingAttachment}
                            className="w-full"
                            setIsEditorFocused={setIsEditorFocused}
                            isEditorFocused={isEditorFocused}
                            setIsEditorEmpty={setIsEditorEmpty}
                            canShowLumoUpsellToggle={false}
                            prefillQuery={suggestedPrompt}
                            spaceId={projectId}
                            onShowDriveBrowser={handleShowDriveBrowser}
                        />
                        <p className="text-center color-weak text-xs mt-2">
                            {c('collider_2025: Disclosure')
                                .t`${LUMO_SHORT_APP_NAME} can make mistakes. Please double-check responses.`}
                        </p>
                    </div>
                    </div>
                </div>

                {/* Sidepanel - Desktop only */}
                {!isMobileViewport && showSidebar && (
                    <ProjectFilesPanel
                        projectId={projectId}
                        instructions={projectInstructions}
                        onEditInstructions={() => instructionsModal.openModal(true)}
                    />
                )}
            </div>

            {/* Mobile Sidebar Modal */}
            {isMobileViewport && sidebarModal.render && (
                <ModalTwo {...sidebarModal.modalProps} size="large" className="project-files-modal">
                    <ModalTwoHeader
                        title={c('collider_2025:Title').t`Instructions & Files`}
                        closeButtonProps={{ onClick: () => sidebarModal.openModal(false) }}
                    />
                    <ModalTwoContent>
                        <ProjectFilesPanel
                            projectId={projectId}
                            instructions={projectInstructions}
                            onEditInstructions={() => {
                                sidebarModal.openModal(false);
                                instructionsModal.openModal(true);
                            }}
                        />
                    </ModalTwoContent>
                </ModalTwo>
            )}

            {instructionsModal.render && (
                <ProjectInstructionsModal
                    {...instructionsModal.modalProps}
                    projectId={projectId}
                    currentInstructions={projectInstructions}
                    space={space}
                />
            )}

            {deleteModal.render && (
                <DeleteProjectModal
                    {...deleteModal.modalProps}
                    project={projectForModal}
                    onConfirmDelete={handleDelete}
                />
            )}

            {/* Drive Browser Modal */}
            {driveBrowserModal.render && (
                <FilesManagementView
                    messageChain={[]}
                    filesContainerRef={{ current: null }}
                    onClose={() => driveBrowserModal.openModal(false)}
                    initialShowDriveBrowser={true}
                    forceModal={true}
                    spaceId={projectId}
                />
            )}
        </div>
    );
};

export const ProjectDetailView = () => {
    return (
        <DragAreaProvider>
            <WebSearchProvider>
                <PandocProvider>
                    <ProjectDetailViewInner />
                </PandocProvider>
            </WebSearchProvider>
        </DragAreaProvider>
    );
};

