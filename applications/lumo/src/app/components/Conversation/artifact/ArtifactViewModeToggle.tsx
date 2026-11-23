import { clsx } from 'clsx';
import { c } from 'ttag';

import { LumoIcon } from '../../LumoIcon/LumoIcon';
import type { WebpageViewMode } from './ArtifactContent';

interface ArtifactViewModeToggleProps {
    mode: WebpageViewMode;
    onChange: (mode: WebpageViewMode) => void;
}

const previewLabel = () => c('collider_2025:Action').t`Preview`;
const codeLabel = () => c('collider_2025:Action').t`Code`;

const getOptionClassName = (active: boolean) =>
    clsx(
        'artifact-view-toggle-option inline-flex items-center justify-center p-0 border-none radius-8 cursor-pointer',
        active
            ? 'artifact-view-toggle-option--active lumo-color-glyph lumo-bg-panel-elevated lumo-elevation-1'
            : 'lumo-color-glyph-mid bg-transparent'
    );

export const ArtifactViewModeToggle = ({ mode, onChange }: ArtifactViewModeToggleProps) => {
    return (
        <div
            className="artifact-view-toggle inline-flex shrink-0 items-center gap-0.5 p-0.5 radius-8 lumo-bg-control-fill"
            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="group"
            aria-label={c('collider_2025:Action').t`View mode`}
        >
            <button
                type="button"
                className={getOptionClassName(mode === 'preview')}
                onClick={() => onChange('preview')}
                title={previewLabel()}
                aria-label={previewLabel()}
                aria-pressed={mode === 'preview'}
            >
                <LumoIcon name="Eye" size={16} aria-hidden />
            </button>
            <button
                type="button"
                className={getOptionClassName(mode === 'code')}
                onClick={() => onChange('code')}
                title={codeLabel()}
                aria-label={codeLabel()}
                aria-pressed={mode === 'code'}
            >
                <LumoIcon name="Code" size={16} aria-hidden />
            </button>
        </div>
    );
};
