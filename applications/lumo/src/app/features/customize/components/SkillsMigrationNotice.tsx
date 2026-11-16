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
        <div className="skills-migration-notice flex flex-nowrap items-start gap-3" role="status">
            <span className="skills-migration-notice__line flex shrink-0 items-center color-primary" aria-hidden>
                <LumoIcon name="Sparkles" size={18} />
            </span>
            <p className="skills-migration-notice__text m-0 text-sm flex-1 min-w-0">
                <span className="text-semibold">{c('collider_2025:Info')
                    .t`Custom ${LUMO_SHORT_APP_NAME}s are now Skills`}</span>
                {'. '}
                {movedCountLabel}
            </p>
            <button
                type="button"
                className="skills-migration-notice__line flex shrink-0 items-center border-none bg-transparent p-0 cursor-pointer color-weak interactive"
                aria-label={c('collider_2025:Action').t`Dismiss`}
                onClick={handleDismiss}
            >
                <LumoIcon name="X" size={14} />
            </button>
        </div>
    );
};
