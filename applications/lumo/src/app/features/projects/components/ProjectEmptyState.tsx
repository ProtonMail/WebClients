import { c } from 'ttag';

import lumoProjects from '@proton/styles/assets/img/lumo/lumo-projects.svg';

interface ProjectEmptyStateProps {
    promptSuggestions: string[];
    onSelectSuggestion: (suggestion: string) => void;
}

export const ProjectEmptyState = ({ promptSuggestions, onSelectSuggestion }: ProjectEmptyStateProps) => (
    <div className="project-detail-empty px-5">
        <img
            src={lumoProjects}
            alt={
                // translator: Accessible description of the project illustration. Projects organize chats, instructions, and files.
                c('collider_2025:Label').t`Projects`
            }
            width={200}
        />
        <h2 className="project-detail-empty-title mt-0 mb-6 mx-0 pt-3 lumo-title-large lumo-color-glyph">
            {c('collider_2025:Title').t`Start a new conversation`}
        </h2>
        {promptSuggestions.length > 0 && (
            <div className="project-detail-prompt-suggestions gap-3">
                {promptSuggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        className="project-detail-prompt-suggestion px-5 border lumo-border radius-8 lumo-body-small lumo-color-glyph lumo-bg-control-fill"
                        onClick={() => onSelectSuggestion(suggestion)}
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        )}
    </div>
);
