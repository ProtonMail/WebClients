import type { KeyboardEventHandler } from 'react';
import { forwardRef, useId, useRef } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcMeetImagePlus } from '@proton/icons/icons/IcMeetImagePlus';
import clsx from '@proton/utils/clsx';

import { BACKGROUND_FILE_INPUT_ACCEPT } from '../../utils/customBackgrounds/constants';
import { BACKGROUND_TILE_CLASS } from './BackgroundTile';

interface AddBackgroundTileProps {
    onAdd: (file: File) => void;
    disabled?: boolean;
    disabledReason?: string;
    isAdding?: boolean;
    className?: string;
    tabIndex?: number;
    onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
}

export const AddBackgroundTile = forwardRef<HTMLButtonElement, AddBackgroundTileProps>(
    ({ onAdd, disabled, disabledReason, isAdding, className, tabIndex, onKeyDown }, ref) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const reasonId = useId();
        const label = c('Action').t`Add your own background`;
        const hasReason = !!disabled && !!disabledReason;

        return (
            <>
                <button
                    ref={ref}
                    type="button"
                    aria-label={label}
                    title={label}
                    aria-disabled={disabled}
                    aria-describedby={hasReason ? reasonId : undefined}
                    aria-busy={isAdding}
                    tabIndex={tabIndex}
                    onClick={() => {
                        if (!disabled) {
                            inputRef.current?.click();
                        }
                    }}
                    onKeyDown={onKeyDown}
                    className={clsx(BACKGROUND_TILE_CLASS, disabled && 'opacity-50', className)}
                >
                    {isAdding ? <CircleLoader size="small" /> : <IcMeetImagePlus size={5} />}
                </button>

                {hasReason && (
                    <span id={reasonId} className="sr-only">
                        {disabledReason}
                    </span>
                )}

                {/* Only ever opened by the button above, so it is kept out of both the tab order and
                    the accessibility tree rather than surfacing as an unlabelled file input. */}
                <input
                    ref={inputRef}
                    type="file"
                    accept={BACKGROUND_FILE_INPUT_ACCEPT}
                    className="sr-only"
                    aria-hidden="true"
                    tabIndex={-1}
                    onChange={(event) => {
                        const file = event.target.files?.[0];

                        // Cleared so picking the same file twice in a row still fires a change event.
                        event.target.value = '';

                        if (file) {
                            onAdd(file);
                        }
                    }}
                />
            </>
        );
    }
);

AddBackgroundTile.displayName = 'AddBackgroundTile';
