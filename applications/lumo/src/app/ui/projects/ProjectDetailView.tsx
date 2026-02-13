import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useModalStateObject,
    usePopperAnchor,
} from '@proton/components';
import useApi from '@proton/components/hooks/useApi';
import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';
import lumoProjects from '@proton/styles/assets/img/lumo/lumo-projects.svg';

import { usePersonalization } from '../../hooks';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { DragAreaProvider } from '../../providers/DragAreaProvider';
import { WebSearchProvider, useWebSearch } from '../../providers/WebSearchProvider';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import {
    selectAttachmentsBySpaceId,
    selectConversationsBySpaceId,
    selectProvisionalAttachments,
    selectSpaceById,
} from '../../redux/selectors';
import { pushAttachmentRequest, upsertAttachment } from '../../redux/slices/core/attachments';
import {
    locallyDeleteConversationFromLocalRequest,
    pushConversationRequest,
} from '../../redux/slices/core/conversations';
import { addSpace, pullSpaceRequest, pushSpaceRequest } from '../../redux/slices/core/spaces';
import { getProjectInfo } from '../../types';
import { type ConversationGroup, SelectableConversationList } from '../components/Conversations';
import { applyRetentionPolicy, categorizeConversations } from '../sidepanel/helpers';
import { openLumoUpsellModal } from '../upsells/providers/LumoUpsellModalProvider';
import { FilesManagementView } from '../components/Files/KnowledgeBase/FilesManagementView';
import { HeaderWrapper } from '../header/HeaderWrapper';
import { ComposerComponent } from '../interactiveConversation/composer/ComposerComponent';
import { sendMessage } from '../interactiveConversation/helper';
import { ProjectFilesPanel } from './ProjectFilesPanel';
import ProjectSettingsButton from './ProjectSettingsButton';
import { getProjectCategory, getPromptSuggestionsForCategory } from './constants';
import { useProjectActions } from './hooks/useProjectActions';
import { DeleteProjectModal } from './modals/DeleteProjectModal';
import { ProjectInstructionsModal } from './modals/ProjectInstructionsModal';
import type { Project } from './types';

import './ProjectDetailView.scss';

interface RouteParams {
    projectId: string;
}

// Conversation dropdown component
interface ConversationDropdownProps {
    conversationId: string;
    onDelete: () => void;
}

const ConversationDropdown = ({ onDelete }: ConversationDropdownProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        close();
        onDelete();
    };

    return (
        <>
            <button
                ref={anchorRef}
                className="conversation-menu-button shrink-0 p-1 rounded hover:bg-weak"
                aria-label={c('collider_2025:Action').t`More options`}
                onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                }}
            >
                <Icon name="three-dots-vertical" size={4} />
            </button>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} className="chat-dropdown-menu">
                <DropdownMenu>
                    <DropdownMenuButton className="text-left color-danger" onClick={handleDelete}>
                        <Icon name="trash" className="mr-2" />
                        {c('collider_2025:Action').t`Delete conversation`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

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
    const deleteConversationModal = useModalStateObject();
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
    const sidebarModal = useModalStateObject();
    const driveBrowserModal = useModalStateObject();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { isSmallScreen: isMobileViewport } = useIsLumoSmallScreen();
    const { personalization } = usePersonalization();
    const { smoothRendering: ffSmoothRendering, externalTools: ffExternalTools, imageTools: ffImageTools } = useLumoFlags();

    // Editable title state
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const titleInputRef = useRef<HTMLInputElement>(null);

    const space = useLumoSelector(selectSpaceById(projectId));
    const conversations = useLumoSelector(selectConversationsBySpaceId(projectId));
    const allConversations = Object.values(conversations);
    const { hasLumoPlus } = useLumoPlan();

    // Project data
    const { project } = getProjectInfo(space);
    const projectName = project?.projectName || 'Untitled Project';
    const projectInstructions = project?.projectInstructions || '';
    const category = getProjectCategory(project?.projectIcon);

    // Apply retention policy (free users only see last 7 days)
    const filteredConversations = applyRetentionPolicy(allConversations, hasLumoPlus);

    // Sort conversations by updatedAt (most recently updated first)
    const sortedConversations = [...filteredConversations].sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Categorize conversations using the same logic as the sidebar
    const { today, lastWeek, expiringSoon, lastMonth, earlier } = categorizeConversations(sortedConversations, hasLumoPlus);

    // Combine for display (free users won't see lastMonth/earlier due to retention policy)
    const todayConversations = today;
    const last7DaysConversations = lastWeek;
    const expiringSoonConversations = expiringSoon;
    const olderConversations = [...lastMonth, ...earlier];

    const spaceAttachments = useLumoSelector(selectAttachmentsBySpaceId(projectId));
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);

    const { createConversationInProject, deleteProject } = useProjectActions();
    const { isWebSearchButtonToggled } = useWebSearch();

    // Sync space data when navigating to a project to ensure we have the latest state
    // This ensures project-level data (files, settings, linked folders) stays in sync across browsers
    useEffect(() => {
        if (!projectId) return;

        console.log(`Project navigation: pulling specific space to sync project ${projectId}`);
        dispatch(pullSpaceRequest({ id: projectId }));
    }, [dispatch, projectId]);

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

                const isWebSearchButtonToggled = false; // todo wire the web search button

                // Send the message using the helper function
                // sendMessage returns a thunk, so we need to dispatch it
                console.log('Sending message...');
                await dispatch(
                    sendMessage({
                        applicationContext: {
                            api,
                            signal: new AbortController().signal,
                        },
                        newMessageData: {
                            content,
                            attachments: provisionalAttachments,
                        },
                        conversationContext: {
                            spaceId: projectId,
                            conversationId,
                            allConversationAttachments: [],
                            messageChain: [],
                            contextFilters: [],
                        },
                        uiContext: {
                            navigateCallback: (newConvId: string) => {
                                console.log('Navigate callback:', newConvId);
                                history.push(`/c/${newConvId}`);
                            },
                            enableExternalTools: isWebSearchButtonToggled && ffExternalTools,
                            enableImageTools: ffImageTools,
                            enableSmoothing: ffSmoothRendering,
                        },
                        settingsContext: {
                            personalization,
                        },
                    })
                );
                console.log('Message sent successfully');
            } catch (error) {
                console.error('Error in handleSendInProject:', error);
                throw error; // Re-throw to see it in error boundary
            }
        },
        [api, dispatch, projectId, provisionalAttachments, createConversationInProject, history, isWebSearchButtonToggled]
    );

    // Title editing handlers - must be defined before conditional return (Rules of Hooks)
    const handleSaveTitle = useCallback(() => {
        const trimmedTitle = editedTitle.trim();
        if (trimmedTitle && trimmedTitle !== projectName && space) {
            const updatedSpace = {
                ...space,
                projectName: trimmedTitle,
            };
            dispatch(addSpace(updatedSpace));
            dispatch(pushSpaceRequest({ id: projectId }));
        }
        setIsEditingTitle(false);
    }, [editedTitle, projectName, space, dispatch, projectId]);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    // Handler for deleting multiple conversations - must be before conditional return (Rules of Hooks)
    const handleDeleteSelectedConversations = useCallback(
        async (conversationIds: string[]) => {
            for (const id of conversationIds) {
                dispatch(locallyDeleteConversationFromLocalRequest(id));
                dispatch(pushConversationRequest({ id }));
            }
        },
        [dispatch]
    );

    if (!space || !space.isProject) {
        return (
            <div className="project-detail-not-found flex flex-column items-center justify-center">
                <img src={lumoProjects} alt="Projects" width={200} />
                <h2 className="text-lg">{c('collider_2025:Error').t`Project not found`}</h2>
                <Button onClick={() => history.push('/projects')}>
                    {c('collider_2025:Button').t`Back to projects`}
                </Button>
            </div>
        );
    }

    // Count files for this space (exclude auto-retrieved and require filename to match ProjectFilesPanel)
    const fileCount = Object.values(spaceAttachments).filter(
        (att) => !att.error && !att.autoRetrieved && att.filename
    ).length;

    // Get prompt suggestions based on project category (only shown when no conversations exist)
    const promptSuggestions = sortedConversations.length === 0 ? getPromptSuggestionsForCategory(category.id) : [];

    // Create a Project object for the delete modal
    // Use allConversations.length for the total count (not filtered by retention policy)
    const projectForModal: Project = {
        id: projectId,
        name: projectName,
        description: projectInstructions,
        fileCount,
        conversationCount: allConversations.length,
        spaceId: projectId,
    };

    const handleDelete = () => {
        void deleteProject(projectId);
    };

    const handleDeleteConversation = (conversationId: string) => {
        setConversationToDelete(conversationId);
        deleteConversationModal.openModal(true);
    };

    const confirmDeleteConversation = () => {
        if (conversationToDelete) {
            // First mark as deleted locally
            dispatch(locallyDeleteConversationFromLocalRequest(conversationToDelete));
            // Then trigger remote sync to call DELETE /conversations/{conversationId}
            dispatch(pushConversationRequest({ id: conversationToDelete }));
            setConversationToDelete(null);
            deleteConversationModal.modalProps.onClose?.();
        }
    };

    const handleProjectSettingsButtonClick = () => {
        if (isMobileViewport) {
            sidebarModal.openModal(true);
        } else {
            setShowSidebar(!showSidebar);
        }
    };

    const handleStartEditingTitle = () => {
        setEditedTitle(projectName);
        setIsEditingTitle(true);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveTitle();
        } else if (e.key === 'Escape') {
            setIsEditingTitle(false);
            setEditedTitle(projectName);
        }
    };

    const handleUpgradeClick = () => {
        openLumoUpsellModal(LUMO_UPSELL_PATHS.CHAT_HISTORY);
    };

    return (
        <div className="project-detail-view flex flex-column">
            {isMobileViewport && (
                <HeaderWrapper>
                    <></>
                </HeaderWrapper>
            )}
            <div
                className={clsx(
                    'project-detail-header flex flex-nowrap items-baseline',
                    showSidebar ? 'with-sidebar' : 'without-sidebar'
                )}
            >
                <div className="project-detail-header-content flex flex-column w-full">
                    <div className="flex flex-row flex-nowrap justify-space-between">
                        <Button
                            shape="ghost"
                            onClick={() => history.push('/projects')}
                            className="project-detail-back-button flex items-center px-0"
                            title={c('collider_2025:Action').t`Back to projects`}
                        >
                            <Icon name="arrow-left" className="mr-1" />
                            <span className="project-detail-back-text">{c('collider_2025:Navigation')
                                .t`All projects`}</span>
                        </Button>

                        <div className="project-detail-actions flex">
                            <ProjectSettingsButton
                                onClick={handleProjectSettingsButtonClick}
                                showSidebar={showSidebar}
                                isMobileView={isMobileViewport}
                            />
                        </div>
                    </div>

                    <div className="project-detail-title-section flex items-center flex-nowrap w-full">
                        <Icon name={category.icon as any} size={6} className="project-detail-title-icon shrink-0" />
                        {isEditingTitle ? (
                            <input
                                ref={titleInputRef}
                                type="text"
                                className="project-detail-title-input text-2xl"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                onBlur={handleSaveTitle}
                                onKeyDown={handleTitleKeyDown}
                                maxLength={100}
                            />
                        ) : (
                            <>
                                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
                                <h1
                                    className="project-detail-title text-2xl text-ellipsis"
                                    onClick={handleStartEditingTitle}
                                    title={c('collider_2025:Action').t`Click to edit title`}
                                >
                                    {projectName}
                                </h1>
                            </>
                        )}
                        <Button
                            ref={anchorRef}
                            icon
                            shape="ghost"
                            onClick={toggle}
                            title={c('collider_2025:Action').t`More options`}
                        >
                            <Icon name="three-dots-horizontal" />
                        </Button>
                        <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} className="chat-dropdown-menu">
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
                </div>
            </div>

            <div
                className={`project-detail-content flex-1 relative overflow-hidden ${showSidebar ? 'with-sidebar' : 'without-sidebar'}`}
            >
                {/* Main area - similar to 'outer' in lumo-chat-container */}
                <div className="outer">
                    <div className="project-detail-main">
                        {sortedConversations.length === 0 ? (
                            <div className="project-detail-empty">
                                <img src={lumoProjects} alt="Projects" width={200} />
                                <h2 className="project-detail-empty-title text-lg pt-3">
                                    {c('collider_2025:Title').t`Start a new conversation`}
                                </h2>
                                {promptSuggestions.length > 0 && (
                                    <div className="project-detail-prompt-suggestions">
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
                            <div className="project-detail-conversations pt-5 mb-0">
                                <div className="project-detail-conversation-list p-0 md:py-4 md:pl-8 md:pr-6">
                                    <SelectableConversationList
                                        groups={
                                            [
                                                {
                                                    title: c('collider_2025:Title').t`Today`,
                                                    conversations: todayConversations,
                                                },
                                                {
                                                    title: c('collider_2025:Title').t`Last 7 days`,
                                                    conversations: last7DaysConversations,
                                                },
                                                !hasLumoPlus && expiringSoonConversations.length > 0
                                                    ? {
                                                          title: c('collider_2025:Title').t`Expiring Soon`,
                                                          conversations: expiringSoonConversations,
                                                          headerAction: (
                                                              <button
                                                                  className="keep-projects-button text-sm color-weak bg-transparent border-none cursor-pointer p-0"
                                                                  onClick={handleUpgradeClick}
                                                              >
                                                                  {c('collider_2025:Action').t`Keep these chats`}
                                                              </button>
                                                          ),
                                                      }
                                                    : null,
                                                {
                                                    title: c('collider_2025:Title').t`Older`,
                                                    conversations: olderConversations,
                                                },
                                            ].filter((g) => g && g.conversations.length > 0) as ConversationGroup[]
                                        }
                                        onConversationClick={(id) => history.push(`/c/${id}`)}
                                        onDeleteSelected={handleDeleteSelectedConversations}
                                        renderConversationActions={(conversation) => (
                                            <ConversationDropdown
                                                conversationId={conversation.id}
                                                onDelete={() => handleDeleteConversation(conversation.id)}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="project-detail-composer">
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
                        key={projectId}
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
                        title={c('collider_2025:Title').t`Settings`}
                        closeButtonProps={{ onClick: () => sidebarModal.openModal(false) }}
                    />
                    <ModalTwoContent>
                        <ProjectFilesPanel
                            key={projectId}
                            projectId={projectId}
                            instructions={projectInstructions}
                            onEditInstructions={() => {
                                sidebarModal.openModal(false);
                                instructionsModal.openModal(true);
                            }}
                            modal
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

            {deleteConversationModal.render && (
                <ModalTwo {...deleteConversationModal.modalProps} size="small">
                    <ModalTwoHeader title={c('collider_2025:Title').t`Delete conversation?`} />
                    <ModalTwoContent>
                        <p>{c('collider_2025:Info')
                            .t`Are you sure you want to delete this conversation? This action cannot be undone.`}</p>
                    </ModalTwoContent>
                    <ModalTwoFooter>
                        <Button onClick={deleteConversationModal.modalProps.onClose} color="weak">
                            {c('collider_2025:Button').t`Cancel`}
                        </Button>
                        <Button onClick={confirmDeleteConversation} color="danger">
                            {c('collider_2025:Button').t`Delete`}
                        </Button>
                    </ModalTwoFooter>
                </ModalTwo>
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
                <ProjectDetailViewInner />
            </WebSearchProvider>
        </DragAreaProvider>
    );
};
