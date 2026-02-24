import { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent, ModalTwoHeader, useModalStateObject } from '@proton/components';
import useApi from '@proton/components/hooks/useApi';
import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';
import lumoProjects from '@proton/styles/assets/img/lumo/lumo-projects.svg';

import { ComposerComponent } from '../../components/Composer/ComposerComponent';
import { sendMessage } from '../../components/Conversation/helper';
import { FilesManagementView } from '../../components/Files';
import { type ConversationGroup, SelectableConversationList } from '../../components/SelectableConversationList';
import { usePersonalization } from '../../hooks';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { HeaderWrapper } from '../../layouts/header/HeaderWrapper';
import { applyRetentionPolicy, categorizeConversations } from '../../layouts/sidepanel/helpers';
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
import { openLumoUpsellModal } from '../../upsells/providers/LumoUpsellModalProvider';
import { ProjectFilesPanel } from './ProjectFilesPanel';
import { ConversationDropdown } from './components/ConversationDropdown';
import { ProjectDetailHeader } from './components/ProjectDetailHeader';
import { ProjectEmptyState } from './components/ProjectEmptyState';
import { getProjectCategory, getPromptSuggestionsForCategory } from './constants';
import { useProjectActions } from './hooks/useProjectActions';
import { DeleteConversationModal } from './modals/DeleteConversationModal';
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
    const [suggestedPrompt, setSuggestedPrompt] = useState<string | undefined>(undefined);

    // Modal state
    const instructionsModal = useModalStateObject();
    const deleteModal = useModalStateObject();
    const deleteConversationModal = useModalStateObject();
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
    const sidebarModal = useModalStateObject();
    const driveBrowserModal = useModalStateObject();

    const { isSmallScreen: isMobileViewport } = useIsLumoSmallScreen();
    const { personalization } = usePersonalization();
    const {
        smoothRendering: ffSmoothRendering,
        externalTools: ffExternalTools,
        imageTools: ffImageTools,
    } = useLumoFlags();

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
    const { today, lastWeek, expiringSoon, lastMonth, earlier } = categorizeConversations(
        sortedConversations,
        hasLumoPlus
    );

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

                // TODO: cross check against with sendMessage logic, provisional attachments are being assigned twice
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
        [
            api,
            dispatch,
            projectId,
            provisionalAttachments,
            createConversationInProject,
            history,
            isWebSearchButtonToggled,
        ]
    );

    const handleSaveTitle = useCallback(
        (newTitle: string) => {
            if (!space || !space.isProject) return;
            dispatch(addSpace({ ...space, projectName: newTitle }));
            dispatch(pushSpaceRequest({ id: projectId }));
        },
        [space, dispatch, projectId]
    );

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
            dispatch(locallyDeleteConversationFromLocalRequest(conversationToDelete));
            dispatch(pushConversationRequest({ id: conversationToDelete }));
            setConversationToDelete(null);
        }
    };

    const handleProjectSettingsButtonClick = () => {
        if (isMobileViewport) {
            sidebarModal.openModal(true);
        } else {
            setShowSidebar(!showSidebar);
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
            <ProjectDetailHeader
                projectName={projectName}
                category={category}
                showSidebar={showSidebar}
                isMobileView={isMobileViewport}
                onBack={() => history.push('/projects')}
                onProjectSettingsClick={handleProjectSettingsButtonClick}
                onSaveTitle={handleSaveTitle}
                onDeleteProject={() => deleteModal.openModal(true)}
            />

            <div
                className={`project-detail-content flex-1 relative overflow-hidden ${showSidebar ? 'with-sidebar' : 'without-sidebar'}`}
            >
                {/* Main area - similar to 'outer' in lumo-chat-container */}
                <div className="outer">
                    <div className="project-detail-main">
                        {sortedConversations.length === 0 ? (
                            <ProjectEmptyState
                                promptSuggestions={promptSuggestions}
                                onSelectSuggestion={setSuggestedPrompt}
                            />
                        ) : (
                            <div className="project-detail-conversations pt-5 mb-0">
                                <div className="project-detail-conversation-list p-0 md:py-4 md:pl-8 md:pr-6">
                                    <SelectableConversationList
                                        groups={
                                            [
                                                {
                                                    title: c('collider_2025:Title').t`Today`,
                                                    conversations: today,
                                                },
                                                {
                                                    title: c('collider_2025:Title').t`Last 7 days`,
                                                    conversations: lastWeek,
                                                },
                                                !hasLumoPlus && expiringSoon.length > 0
                                                    ? {
                                                          title: c('collider_2025:Title').t`Expiring Soon`,
                                                          conversations: expiringSoon,
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
                                isProcessingAttachment={false}
                                className="w-full"
                                setIsEditorFocused={setIsEditorFocused}
                                isEditorFocused={isEditorFocused}
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
                <DeleteConversationModal
                    {...deleteConversationModal.modalProps}
                    onConfirm={confirmDeleteConversation}
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
                <ProjectDetailViewInner />
            </WebSearchProvider>
        </DragAreaProvider>
    );
};
