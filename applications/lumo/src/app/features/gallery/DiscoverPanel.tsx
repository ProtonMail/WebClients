import {useCallback, useState} from 'react';

import {c} from 'ttag';

import {Icon} from '@proton/components';

import {getGalleryPromptSuggestions, type GalleryPromptSuggestion} from './promptSuggestions';

import './GalleryView.scss';

const SUGGESTIONS_PER_PAGE = 3;

function pickSuggestions(pool: GalleryPromptSuggestion[], exclude: GalleryPromptSuggestion[]): GalleryPromptSuggestion[] {
    const excludeIds = new Set(exclude.map((s) => s.id));
    const remaining = pool.filter((s) => !excludeIds.has(s.id));
    const source = remaining.length >= SUGGESTIONS_PER_PAGE ? remaining : pool;
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, SUGGESTIONS_PER_PAGE);
}

const ACTION_BADGE: Record<GalleryPromptSuggestion['action'], string> = {
    edit_image: 'Upload',
    sketch: 'Sketch',
    prompt: 'Create',
};

const SuggestionCard = ({
                            suggestion,
                            onClick,
                        }: {
    suggestion: GalleryPromptSuggestion;
    onClick: (s: GalleryPromptSuggestion) => void;
}) => (
    <button className="gallery-suggestion-card" onClick={() => onClick(suggestion)} type="button">
        <span className="gallery-suggestion-card__img-wrap">
            <img src={suggestion.img} alt="" className="gallery-suggestion-card__img"/>
        </span>
        <span className="gallery-suggestion-card__body">
            <span className="gallery-suggestion-card__badge">
                {ACTION_BADGE[suggestion.action]}
            </span>
            <span className="gallery-suggestion-card__title">{suggestion.title}</span>
        </span>
    </button>
);

export const DiscoverPanel = ({onSuggestionClick}: { onSuggestionClick: (s: GalleryPromptSuggestion) => void }) => {
    const [visible, setVisible] = useState<GalleryPromptSuggestion[]>(() =>
        pickSuggestions(getGalleryPromptSuggestions(), [])
    );
    const [expanded, setExpanded] = useState(true);

    const handleShuffle = useCallback(() => {
        setVisible((prev) => pickSuggestions(getGalleryPromptSuggestions(), prev));
    }, []);

    return (
        <div className="gallery-discover">
            <div className="gallery-discover__header">
                <span className="gallery-discover__title">
                    {expanded && (
                        c('collider_2025:Label').t`Discover what Lumo can create`
                    )}
                </span>
                <span className="gallery-discover__header-actions">
                    {expanded && (
                        <button
                            className="gallery-discover__shuffle"
                            onClick={handleShuffle}
                            type="button"
                            title={c('collider_2025:Action').t`Shuffle suggestions`}
                        >
                            <Icon name="arrows-rotate" size={4}/>
                        </button>
                    )}
                    <button
                        className="gallery-discover__toggle"
                        onClick={() => setExpanded((v) => !v)}
                        type="button"
                    >
                        {expanded
                            ? c('collider_2025:Action').t`Hide suggestions`
                            : c('collider_2025:Action').t`Show suggestions`}
                    </button>
                </span>
            </div>
            {expanded && (
                <div className="gallery-discover__grid">
                    {visible.map((s) => (
                        <SuggestionCard key={s.id} suggestion={s} onClick={onSuggestionClick}/>
                    ))}
                </div>
            )}
        </div>
    );
};
