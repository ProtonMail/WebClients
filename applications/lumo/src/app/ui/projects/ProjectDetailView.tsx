import { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Hamburger,
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
    const sidebarModal = useModalStateObject();
    const driveBrowserModal = useModalStateObject();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const space = useLumoSelector((state) => selectSpaceById(projectId)(state));
    const conversations = useLumoSelector((state) => selectConversationsBySpaceId(projectId)(state));
    const conversationList = Object.values(conversations);
    const spaceAttachments = useLumoSelector((state) => selectAttachmentsBySpaceId(projectId)(state));
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const { isVisible: isSideMenuOpen, toggle: toggleSideMenu, isSmallScreen } = useSidebar();
    const [isMobileViewport, setIsMobileViewport] = useState(false);

    // Check if viewport is <= 768px (matches CSS breakpoint)
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
        if (category.id === 'health') {
            return [
                'What do these lab values mean and are any outside normal ranges?',
                'Help me prepare questions about this diagnosis for my doctor',
                'Explain this medication and its potential side effects',
            ];
        }
        // Financial
        if (category.id === 'financial' || category.id === 'investing') {
            return [
                'Analyze my spending patterns and suggest areas to reduce expenses',
                'Review my investment portfolio allocation and suggest rebalancing',
                'Help me understand the tax implications of this financial decision',
            ];
        }
        // Legal
        if (category.id === 'legal') {
            return [
                'Summarize the key obligations and rights in this contract',
                'What are the termination clauses and notice requirements?',
                'Identify any unusual or potentially unfavorable terms',
            ];
        }
        // Research
        if (category.id === 'research') {
            return [
                'Compare the methodologies used across these studies',
                'What are the main findings and how do they relate to each other?',
                'Identify research gaps and suggest future research directions',
            ];
        }
        // Writing
        if (category.id === 'writing') {
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
            <div className={`project-detail-header ${showSidebar ? 'with-sidebar' : 'without-sidebar'}`}>
                {isSmallScreen && (
                    <Hamburger onToggle={toggleSideMenu} expanded={isSideMenuOpen} iconSize={5} />
                )}
                <div className="project-detail-header-content">
                    <Button
                        icon
                        shape="ghost"
                        onClick={() => history.push('/projects')}
                        className="project-detail-back-button"
                        title={c('collider_2025:Action').t`Back to projects`}
                    >
                        <Icon name="arrow-left" className="mr-1" />
                        <span className="project-detail-back-text">{c('collider_2025:Navigation').t`All projects`}</span>
                    </Button>
                    <div className="project-detail-title-section">
                        <Icon name={category.icon as any} size={6} className="project-detail-title-icon" />
                        <h1 className="project-detail-title">{projectName}</h1>
                    </div>
                </div>
                <div className="project-detail-actions">
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
                        className="project-detail-settings-button"
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
            </div>

            <div className={`project-detail-content ${showSidebar ? 'with-sidebar' : 'without-sidebar'}`}>
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
                        <div className="project-detail-conversations pt-5">

                            <div className="project-detail-conversation-list">
                                {conversationList.map((conversation) => {
                                    const createdAt = new Date(conversation.createdAt);
                                    const isToday = createdAt.toDateString() === new Date().toDateString();
                                    const formattedDate = isToday
                                        ? createdAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                                        : createdAt.toLocaleDateString([], { month: 'short', day: 'numeric' });

                                    return (
                                        <button
                                            key={conversation.id}
                                            className="project-detail-conversation-item"
                                            onClick={() => history.push(`/c/${conversation.id}`)}
                                        >
                                            <div className="project-detail-conversation-content">
                                                <span className="project-detail-conversation-title">
                                                    {conversation.title || c('collider_2025:Label').t`Untitled chat`}
                                                </span>
                                                <span className="project-detail-conversation-date">
                                                    {formattedDate}
                                                </span>
                                            </div>
                                            <Icon name="arrow-right" size={3} className="project-detail-conversation-arrow" />
                                        </button>
                                    );
                                })}
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
                            onShowDriveBrowser={handleShowDriveBrowser}
                        />
                        <p className="text-center color-weak text-xs mt-2">
                            {c('collider_2025: Disclosure')
                                .t`${LUMO_SHORT_APP_NAME} can make mistakes. Please double-check responses.`}
                        </p>
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

