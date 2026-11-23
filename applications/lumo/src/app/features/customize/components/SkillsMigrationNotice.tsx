import { useState } from 'react';

import { c, msgid } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';

import './SkillsMigrationNotice.scss';

const STORAGE_KEY = 'lumo-customize-skills-migration-dismissed';

const readDismissed = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
};

interface SkillsMigrationNoticeProps {
    customLumoCount: number;
}

export const SkillsMigrationNotice = ({ customLumoCount }: SkillsMigrationNoticeProps) => {
    const [dismissed, setDismissed] = useState(readDismissed);

    if (dismissed || customLumoCount <= 0) {
        return null;
    }

    const handleDismiss = () => {
        setDismissed(true);
        try {
            localStorage.setItem(STORAGE_KEY, '1');
        } catch {
            // Ignore storage failures; the notice stays dismissed for this session.
        }
    };

    const movedCountLabel = c('collider_2025:Info').ngettext(
        msgid`We moved your ${customLumoCount} Custom ${LUMO_SHORT_APP_NAME} here. It works the same way, and you can now use it in any chat or scheduled task.`,
        `We moved your ${customLumoCount} Custom ${LUMO_SHORT_APP_NAME}s here. They work the same way, and you can now use them in any chat or scheduled task.`,
        customLumoCount
    );

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div className="skills-migration-notice pl-4 pr-3 flex flex-nowrap items-start gap-3 radius-12" role="status">
            <span
                className="skills-migration-notice__line flex shrink-0 items-center lumo-color-glyph-brand-text"
                aria-hidden
            >
                <LumoIcon name="Sparkles" size={18} />
            </span>
            <output className="skills-migration-notice__text flex-1 min-w-0 m-0 lumo-body-small">
                <span className="lumo-title-small">{c('collider_2025:Info')
                    .t`Custom ${LUMO_SHORT_APP_NAME}s are now Skills`}</span>
                {'. '}
                {movedCountLabel}
            </output>
            <button
                type="button"
                className="skills-migration-notice__line flex shrink-0 items-center p-0 border-none lumo-color-glyph-mid bg-transparent cursor-pointer interactive"
                aria-label={c('collider_2025:Action').t`Dismiss`}
                onClick={handleDismiss}
            >
                <LumoIcon name="X" size={14} />
            </button>
        </div>
    );
};
