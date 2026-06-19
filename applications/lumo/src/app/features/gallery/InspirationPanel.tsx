import { useMemo } from 'react';

import { c } from 'ttag';

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

// TODO: clean up if we don't need shuffle functionality for final version
export const DiscoverList = ({ onSuggestionClick }: { onSuggestionClick: (s: GalleryPromptSuggestion) => void }) => {
    const pool = useMemo(() => getGalleryPromptSuggestions(), []);
    // const [visible, setVisible] = useState<GalleryPromptSuggestion[]>(() => pickSuggestions(pool, []));
    const visible = useMemo(() => pickSuggestions(pool, []), [pool]);

    return (
        <div className="w-full overflow-x-auto mt-10">

            <div className="flex flex-row flex-nowrap gap-4">
                {visible.map((s) => (
                    <button
                        key={s.id}
                        className="inspiration-discover__item border border-weak min-w-custom flex flex-row flex-nowrap gap-4 items-center p-4 rounded-xl text-left min-h-custom"
                        style={{ '--min-w-custom': '250px', '--min-h-custom': '100px' }}
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

//TODO: remove if this is no longer used

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
