import { useCallback, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Hamburger,
    Icon,
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
import { getProjectCategory } from './constants';
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
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const space = useLumoSelector((state) => selectSpaceById(projectId)(state));
    const conversations = useLumoSelector((state) => selectConversationsBySpaceId(projectId)(state));
    const conversationList = Object.values(conversations);
    const spaceAttachments = useLumoSelector((state) => selectAttachmentsBySpaceId(projectId)(state));
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const { isVisible: isSideMenuOpen, toggle: toggleSideMenu, isSmallScreen } = useSidebar();

    const { createConversationInProject, deleteProject } = useProjectActions();

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
            <div className="project-detail-not-found">
                <Icon name="exclamation-circle" size={4} />
                <h2>{c('collider_2025:Error').t`Project not found`}</h2>
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

    // Get prompt suggestions based on project name (for newly created example projects)
    const getPromptSuggestions = (): string[] => {
        // Health/Medical
        if (projectName.toLowerCase().includes('health') || projectName.toLowerCase().includes('medical')) {
            return [
                'What do these lab values mean and are any outside normal ranges?',
                'Help me prepare questions about this diagnosis for my doctor',
                'Explain this medication and its potential side effects',
            ];
        }
        // Financial
        if (projectName.toLowerCase().includes('financ')) {
            return [
                'Analyze my spending patterns and suggest areas to reduce expenses',
                'Review my investment portfolio allocation and suggest rebalancing',
                'Help me understand the tax implications of this financial decision',
            ];
        }
        // Legal
        if (projectName.toLowerCase().includes('legal') || projectName.toLowerCase().includes('contract')) {
            return [
                'Summarize the key obligations and rights in this contract',
                'What are the termination clauses and notice requirements?',
                'Identify any unusual or potentially unfavorable terms',
            ];
        }
        // Research
        if (projectName.toLowerCase().includes('research')) {
            return [
                'Compare the methodologies used across these studies',
                'What are the main findings and how do they relate to each other?',
                'Identify research gaps and suggest future research directions',
            ];
        }
        // Writing
        if (projectName.toLowerCase().includes('writ')) {
            return [
                'Help me refine this draft to be more concise and impactful',
                'Suggest ways to improve the flow and structure of this text',
                'Review this for clarity, tone, and grammatical errors',
            ];
        }
        return [];
    };

    const promptSuggestions = conversationList.length === 0 ? getPromptSuggestions() : [];
    
    // Create a Project object for the delete modal
    const projectForModal: Project = {
        id: projectId,
        name: projectName,
        description: projectInstructions,
        fileCount,
        conversationCount: conversationList.length,
        spaceId: projectId,
    };

    const handleDelete = () => {
        deleteProject(projectId);
    };

    return (
        <div className="project-detail-view">
            {/* Header */}
            <div className="project-detail-header">
                {isSmallScreen && (
                    <Hamburger onToggle={toggleSideMenu} expanded={isSideMenuOpen} iconSize={5} />
                )}
                <Button
                    icon
                    shape="ghost"
                    onClick={() => history.push('/projects')}
                    title={c('collider_2025:Action').t`Back to projects`}
                >
                    <Icon name="arrow-left" />
                </Button>
                <div className="project-detail-title-section">
                    <div className="project-detail-icon" style={{ backgroundColor: category.color }}>
                        <Icon name={category.icon as any} size={6} className="color-white" />
                    </div>
                    <h1 className="project-detail-title">{projectName}</h1>
                </div>
                <div className="project-detail-actions">
                    <Button
                        icon
                        shape="ghost"
                        onClick={() => setShowSidebar(!showSidebar)}
                        title={showSidebar ? c('collider_2025:Action').t`Hide sidebar` : c('collider_2025:Action').t`Show sidebar`}
                    >
                        <Icon name={showSidebar ? 'chevron-left' : 'chevron-right'} />
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
            </div>

            <div className="project-detail-content">
                {/* Main area */}
                <div className="project-detail-main">
                    {conversationList.length === 0 ? (
                        <div className="project-detail-empty">
                            <div className="project-detail-empty-icon">
                                <Icon name="speech-bubble" size={12} />
                            </div>
                            <h2 className="project-detail-empty-title">
                                {c('collider_2025:Title').t`Start a new project conversation`}
                            </h2>
                            {promptSuggestions.length > 0 && (
                                <div className="project-detail-prompt-suggestions">
                                    {promptSuggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            className="project-detail-prompt-suggestion"
                                            onClick={() => setSuggestedPrompt(suggestion)}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="project-detail-conversations">
                            <h3 className="project-detail-section-title">
                                {c('collider_2025:Title').t`Conversations`} ({conversationList.length})
                            </h3>
                            <div className="project-detail-conversation-list">
                                {conversationList.map((conversation) => (
                                    <button
                                        key={conversation.id}
                                        className="project-detail-conversation-item"
                                        onClick={() => history.push(`/c/${conversation.id}`)}
                                    >
                                        <Icon name="speech-bubble" size={4} />
                                        <span className="project-detail-conversation-title">
                                            {conversation.title || c('collider_2025:Label').t`Untitled chat`}
                                        </span>
                                        <Icon name="chevron-right" size={4} className="ml-auto" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Composer area */}
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
                        />
                        <p className="text-center color-weak text-xs mt-2">
                            {c('collider_2025: Disclosure')
                                .t`${LUMO_SHORT_APP_NAME} can make mistakes. Please double-check responses.`}
                        </p>
                    </div>
                </div>

                {/* Sidebar */}
                {showSidebar && (
                    <ProjectFilesPanel
                        projectId={projectId}
                        instructions={projectInstructions}
                        onEditInstructions={() => instructionsModal.openModal(true)}
                    />
                )}
            </div>

            {instructionsModal.render && (
                <ProjectInstructionsModal
                    {...instructionsModal.modalProps}
                    projectId={projectId}
                    currentInstructions={projectInstructions}
                />
            )}

            {deleteModal.render && (
                <DeleteProjectModal
                    {...deleteModal.modalProps}
                    project={projectForModal}
                    onConfirmDelete={handleDelete}
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

