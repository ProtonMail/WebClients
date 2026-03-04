import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { Icon } from '@proton/components';

import { useLumoUserSettings } from '../../hooks/useLumoUserSettings';
import { getGalleryPromptSuggestions, type GalleryPromptSuggestion } from './promptSuggestions';

import './GalleryView.scss';

const SUGGESTIONS_PER_PAGE = 3;

function pickSuggestions(pool: GalleryPromptSuggestion[], exclude: GalleryPromptSuggestion[]): GalleryPromptSuggestion[] {
    const excludeIds = new Set(exclude.map((s) => s.id));
    const remaining = pool.filter((s) => !excludeIds.has(s.id));
    const source = remaining.length >= SUGGESTIONS_PER_PAGE ? remaining : pool;
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, SUGGESTIONS_PER_PAGE);
}

const ACTION_META: Record<GalleryPromptSuggestion['action'], { label: string; icon: string }> = {
    edit_image: { label: 'Upload', icon: 'arrow-up-line' },
    sketch: { label: 'Sketch', icon: 'pen' },
    prompt: { label: 'Create', icon: 'magic-wand' },
};

const SuggestionCard = ({
    suggestion,
    onClick,
}: {
    suggestion: GalleryPromptSuggestion;
    onClick: (s: GalleryPromptSuggestion) => void;
}) => {
    const meta = ACTION_META[suggestion.action];
    return (
        <button className="gallery-suggestion-card" onClick={() => onClick(suggestion)} type="button">
            <span className="gallery-suggestion-card__img-wrap">
                <img src={suggestion.img} alt="" className="gallery-suggestion-card__img" />
                <span className="gallery-suggestion-card__badge">
                    <Icon name={meta.icon as any} size={3} />
                    {meta.label}
                </span>
            </span>
            <span className="gallery-suggestion-card__body">
                <span className="gallery-suggestion-card__title">{suggestion.title}</span>
            </span>
        </button>
    );
};

export const DiscoverPanel = ({ onSuggestionClick }: { onSuggestionClick: (s: GalleryPromptSuggestion) => void }) => {
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const expanded = lumoUserSettings.showGallerySuggestions;

    const [visible, setVisible] = useState<GalleryPromptSuggestion[]>(() =>
        pickSuggestions(getGalleryPromptSuggestions(), [])
    );

    const handleToggle = useCallback(() => {
        updateSettings({ showGallerySuggestions: !expanded, _autoSave: true });
    }, [expanded, updateSettings]);

    const handleShuffle = useCallback(() => {
        setVisible((prev) => pickSuggestions(getGalleryPromptSuggestions(), prev));
    }, []);

    return (
        <div className="gallery-discover">
            <div className="gallery-discover__header">
                <span className="gallery-discover__title">
                    {c('collider_2025:Label').t`Discover what Lumo can create`}
                </span>
                <span className="gallery-discover__header-actions">
                    {expanded && (
                        <button
                            className="gallery-discover__shuffle"
                            onClick={handleShuffle}
                            type="button"
                            title={c('collider_2025:Action').t`Shuffle suggestions`}
                        >
                            <Icon name="arrows-rotate" size={3.5} />
                        </button>
                    )}
                    <button
                        className="gallery-discover__toggle"
                        onClick={handleToggle}
                        type="button"
                    >
                        {expanded
                            ? c('collider_2025:Action').t`Hide`
                            : c('collider_2025:Action').t`Show`}
                    </button>
                </span>
            </div>
            {expanded && (
                <div className="gallery-discover__grid">
                    {visible.map((s) => (
                        <SuggestionCard key={s.id} suggestion={s} onClick={onSuggestionClick} />
                    ))}
                </div>
            )}
        </div>
    );
};
