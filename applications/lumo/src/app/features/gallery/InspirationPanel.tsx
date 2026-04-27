import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Icon } from '@proton/components';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoArtist from '@proton/styles/assets/img/lumo/lumo-artist.svg';

import { type GalleryPromptSuggestion, getGalleryPromptSuggestions } from './promptSuggestions';

import './GalleryView.scss';

const DISCOVER_PER_PAGE = 8;

function pickSuggestions(
    pool: GalleryPromptSuggestion[],
    exclude: GalleryPromptSuggestion[]
): GalleryPromptSuggestion[] {
    const excludeIds = new Set(exclude.map((s) => s.id));
    const remaining = pool.filter((s) => !excludeIds.has(s.id));
    const source = remaining.length >= DISCOVER_PER_PAGE ? remaining : pool;
    return [...source].sort(() => Math.random() - 0.5).slice(0, DISCOVER_PER_PAGE);
}

const DiscoverList = ({ onSuggestionClick }: { onSuggestionClick: (s: GalleryPromptSuggestion) => void }) => {
    const pool = useMemo(() => getGalleryPromptSuggestions(), []);
    const [visible, setVisible] = useState<GalleryPromptSuggestion[]>(() => pickSuggestions(pool, []));

    const handleShuffle = useCallback(() => {
        setVisible((prev) => pickSuggestions(pool, prev));
    }, [pool]);

    const canShuffle = pool.length > DISCOVER_PER_PAGE;

    return (
        <div className="inspiration-discover">
            <div className="inspiration-discover__header">
                <h2 className="text-bold text-lg">
                    {c('collider_2025:Label').t`Discover what ${LUMO_SHORT_APP_NAME} can create`}
                </h2>
                {canShuffle && (
                    <button
                        className="inspiration-discover__shuffle"
                        onClick={handleShuffle}
                        type="button"
                        title={c('collider_2025:Action').t`Shuffle suggestions`}
                    >
                        <Icon name="arrows-rotate" size={3.5} />
                    </button>
                )}
            </div>

            <div className="inspiration-discover__grid">
                {visible.map((s) => (
                    <button
                        key={s.id}
                        className="inspiration-discover__item border border-weak"
                        onClick={() => onSuggestionClick(s)}
                        type="button"
                        aria-label={s.title}
                    >
                        <span className="inspiration-discover__thumb-wrap">
                            <img src={s.img} alt="" className="inspiration-discover__thumb" />
                        </span>
                        <div className="flex flex-column flex-nwowrap">
                            <span className="text-semibold">{s.title}</span>
                            <span className="text-sm color-hint">{s.hint}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ── InspirationPanel ──────────────────────────────────────────────────────────

export const InspirationPanel = ({
    onSuggestionClick,
}: {
    onSuggestionClick: (s: GalleryPromptSuggestion) => void;
}) => {
    return (
        <div className="inspiration-panel gallery-inner justify-center">
            <div className="hidden sm:flex flex-row flex-nowrap items-center justify-center gap-2">
                <h1 className="text-align-left main-text">
                    {c('collider_2025:Title').t`What do you want to create today?`}
                </h1>
                <img src={lumoArtist} alt="Artist" className="" />
            </div>
            <DiscoverList onSuggestionClick={onSuggestionClick} />
        </div>
    );
};
