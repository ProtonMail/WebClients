import { c } from 'ttag';

import lumoProjects from '@proton/styles/assets/img/lumo/lumo-projects.svg';

interface ProjectEmptyStateProps {
    promptSuggestions: string[];
    onSelectSuggestion: (suggestion: string) => void;
}

export const ProjectEmptyState = ({ promptSuggestions, onSelectSuggestion }: ProjectEmptyStateProps) => (
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
                        onClick={() => onSelectSuggestion(suggestion)}
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        )}
    </div>
);
