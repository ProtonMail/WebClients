import { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { Button } from '@proton/atoms/Button/Button';
import { useModalStateObject } from '@proton/components';
import Loader from '@proton/components/components/loader/Loader';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoProjects from '@proton/styles/assets/img/lumo/lumo-projects.svg';

import { ComposerComponent } from '../../components/Composer/ComposerComponent';
import { sendMessage } from '../../components/Conversation/helper';
import { FilesManagementView } from '../../components/Files';
import ConfirmDeleteModal from '../../components/Modals/ConfirmDeleteModal';
import { SelectableConversationList } from '../../components/SelectableConversationList';
import { useLumoUserSettings, usePersonalization } from '../../hooks';
import { useIsChatHistoryHydrating } from '../../hooks/useIsChatHistoryHydrating';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import type { HandleSendMessage } from '../../hooks/useLumoActions';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { applyRetentionPolicy, groupConversationsByDate } from '../../layouts/sidepanel/helpers';
import { ModelTierProvider } from '../../providers/ModelTierProvider';
import { WebSearchProvider, useWebSearch } from '../../providers/WebSearchProvider';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import {
    selectAttachmentsBySpaceId,
    selectConversationHasGeneratedImages,
    selectConversationsBySpaceId,
    selectProvisionalAttachments,
    selectSpaceById,
} from '../../redux/selectors';
import { clearProvisionalAttachments, upsertAttachment } from '../../redux/slices/core/attachments';
import {
    locallyDeleteConversationFromLocalRequest,
    pushConversationRequest,
} from '../../redux/slices/core/conversations';
import { addSpace, pullSpaceRequest, pushSpaceRequest } from '../../redux/slices/core/spaces';
import { ComposerMode, getProjectInfo } from '../../types';
import { ProjectFilesPanel } from './ProjectFilesPanel';
import { ConversationDropdown } from './components/ConversationDropdown';
import { ProjectEmptyState } from './components/ProjectEmptyState';
import { ProjectTitleSection } from './components/ProjectTitleSection';
import { getProjectCategory, getPromptSuggestionsForCategory } from './constants';
import { useNativeComposerProjectDetailVisibilityApi } from './hooks/useNativeComposerProjectDetailVisibilityApi';
import { useProjectActions } from './hooks/useProjectActions';
import { DeleteProjectModal } from './modals/DeleteProjectModal';
import { ProjectInstructionsModal } from './modals/ProjectInstructionsModal';
import type { Project } from './types';

import './ProjectDetailView.scss';

interface RouteParams {
    projectId: string;
}

// TODO: clean up unused css
const ProjectDetailViewInner = () => {
    const { projectId } = useParams<RouteParams>();
    const history = useHistory();
    const isDataHydrating = useIsChatHistoryHydrating();
    const dispatch = useLumoDispatch();
    const api = useApi();
    const [showSidebar] = useState(true);
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [suggestedPrompt, setSuggestedPrompt] = useState<string | undefined>(undefined);

    // Modal state
    const instructionsModal = useModalStateObject();
    const deleteModal = useModalStateObject();
    const deleteConversationModal = useModalStateObject();
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
    const hasGeneratedImagesInConversationToDelete = useLumoSelector(
        selectConversationHasGeneratedImages(conversationToDelete)
    );
    const sidebarModal = useModalStateObject();
    const driveBrowserModal = useModalStateObject();
    const { isSmallScreen: isMobileViewport } = useIsLumoSmallScreen();

    const { personalization } = usePersonalization();
    const {
        smoothRendering: ffSmoothRendering,
        externalTools: ffExternalTools,
        imageTools: ffImageTools,
        visualizationInstructions: ffVisualizationInstructions,
    } = useLumoFlags();

    const space = useLumoSelector(selectSpaceById(projectId));
    const conversations = useLumoSelector(selectConversationsBySpaceId(projectId));
    const allConversations = Object.values(conversations);
    const { hasLumoPlus } = useLumoPlan();
    const { lumoUserSettings } = useLumoUserSettings();
    const dateField = lumoUserSettings.chatHistoryDateField ?? 'updatedAt';

    // Project data
    const { project } = getProjectInfo(space);
    const projectName = project?.projectName || 'Untitled Project';
    const projectInstructions = project?.projectInstructions || '';
    const category = getProjectCategory(project?.projectIcon);

    const retainedConversations = applyRetentionPolicy(allConversations, hasLumoPlus);

    const conversationGroups = groupConversationsByDate(retainedConversations, { sortBy: dateField });

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

    const handleSendInProject = useCallback<HandleSendMessage>(
        async (content, webSearchEnabled, imageOptions, artifactModeActive) => {
            try {
                if (!content.trim() && provisionalAttachments.length === 0) {
                    console.log('Empty content, skipping send');
                    return;
                }

                console.log('Creating conversation in project:', projectId);
                // Create a new conversation in this project
                const conversationId = createConversationInProject(projectId);
                if (!conversationId) {
                    return;
                }
                console.log('Created conversation:', conversationId);

                // Navigate to the conversation first
                history.push(`/c/${conversationId}`);

                // Send the message using the helper function
                // sendMessage returns a thunk, so we need to dispatch it
                console.log('Sending message...');
                const sentAttachmentIds = provisionalAttachments.map((a) => a.id);
                for (const att of provisionalAttachments) {
                    if (!att.spaceId) {
                        dispatch(upsertAttachment({ ...att, conversationContext: true }));
                    }
                }
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
                            // Include provisional attachments so prepareTurns can resolve their
                            // full content (e.g. @mention files). sendMessage will merge RAG
                            // results on top of this list.
                            allConversationAttachments: [...provisionalAttachments],
                            messageChain: [],
                            contextFilters: [],
                        },
                        uiContext: {
                            navigateCallback: (newConvId: string) => {
                                console.log('Navigate callback:', newConvId);
                                history.push(`/c/${newConvId}`);
                            },
                            enableExternalTools: webSearchEnabled && ffExternalTools,
                            enableImageTools: ffImageTools,
                            enableSmoothing: ffSmoothRendering,
                            imageAspectRatio: imageOptions?.aspectRatio,
                            canvasModeActive: artifactModeActive ?? false,
                        },
                        settingsContext: {
                            personalization,
                            isVisualizationInstructionsFeatureEnabled: ffVisualizationInstructions,
                        },
                    })
                );

                // Clear mention-only provisionals now that the message has been sent.
                // Uploaded provisionals (non-mention) were already promoted to the project
                // space by sendMessage → assignProvisionalAttachmentsToSpace.
                dispatch(clearProvisionalAttachments({ preserveIds: sentAttachmentIds }));
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

    // Hide the native composer while these modals are open on mobile, so it
    // doesn't overlap them when the keyboard shows. Only on mobile: on larger
    // screens the composer's own logic decides when to show it.
    useNativeComposerProjectDetailVisibilityApi(sidebarModal.render || (isMobileViewport && instructionsModal.render));

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
        if (isDataHydrating) {
            return (
                <div className="project-detail-not-found flex flex-column items-center justify-center">
                    <Loader size="medium" />
                    <p className="color-weak m-0">{c('collider_2025:Info').t`Loading…`}</p>
                </div>
            );
        }

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
    const promptSuggestions = retainedConversations.length === 0 ? getPromptSuggestionsForCategory(category.id) : [];

    // Create a Project object for the delete modal
    // Use allConversations.length for the total count (not filtered by conversation limit)
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

    return (
        <LumoLayoutWithDrawer
            header={{
                component: (
                    <ProjectTitleSection
                        projectName={projectName}
                        categoryIcon={category.icon}
                        onSaveTitle={handleSaveTitle}
                        onDeleteProject={() => deleteModal.openModal(true)}
                    />
                ),
            }}
            drawer={{
                content: (
                    <ProjectFilesPanel
                        key={projectId}
                        projectId={projectId}
                        instructions={projectInstructions}
                        onEditInstructions={() => instructionsModal.openModal(true)}
                    />
                ),
                title: c('collider_2025:Title').t`Project knowledge`,
                defaultOpened: true,
            }}
        >
            <div className="project-detail-view flex flex-column">
                <div
                    className={`project-detail-content flex-1 relative overflow-hidden ${showSidebar ? 'with-sidebar' : 'without-sidebar'}`}
                >
                    {/* Main area - similar to 'outer' in lumo-chat-container */}
                    <div className="outer">
                        <div className="project-detail-main">
                            {retainedConversations.length === 0 ? (
                                <ProjectEmptyState
                                    promptSuggestions={promptSuggestions}
                                    onSelectSuggestion={setSuggestedPrompt}
                                />
                            ) : (
                                <div className="project-detail-conversations pt-5 mb-0">
                                    <div className="project-detail-conversation-list p-0 md:py-4 md:pl-8 md:pr-6">
                                        <SelectableConversationList
                                            groups={conversationGroups
                                                .map((group) => ({
                                                    title: group.title,
                                                    conversations: group.conversations,
                                                }))
                                                .filter((group) => group.conversations.length > 0)}
                                            showDate={false}
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
                                    composerMode={ComposerMode.PROJECT}
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

                    {/* Sidepanel - Desktop only
                    {!isMobileViewport && showSidebar && (
                        <ProjectFilesPanel
                            key={projectId}
                            projectId={projectId}
                            instructions={projectInstructions}
                            onEditInstructions={() => instructionsModal.openModal(true)}
                        />
                    )} */}
                </div>

                {/* Mobile Sidebar Modal
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
            )} */}

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
                    <ConfirmDeleteModal
                        {...deleteConversationModal.modalProps}
                        handleDelete={() => {
                            confirmDeleteConversation();
                            deleteConversationModal.openModal(false);
                        }}
                        hasGeneratedImages={hasGeneratedImagesInConversationToDelete}
                    />
                )}

                {/* Drive Browser Modal */}
                {driveBrowserModal.render && (
                    <FilesManagementView
                        messageChain={[]}
                        filesContainerRef={{ current: null }}
                        onClose={driveBrowserModal.modalProps.onClose}
                        modalProps={driveBrowserModal.modalProps}
                        initialShowDriveBrowser={true}
                        forceModal={true}
                        spaceId={projectId}
                    />
                )}
            </div>
        </LumoLayoutWithDrawer>
    );
};

export const ProjectDetailView = () => {
    return (
        <WebSearchProvider>
            <ModelTierProvider>
                <ProjectDetailViewInner />
            </ModelTierProvider>
        </WebSearchProvider>
    );
};
