import { useState } from 'react';

import { c } from 'ttag';

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

    const movedCountLabel =
        customLumoCount === 1
            ? c('collider_2025:Info').t`We moved your 1 Custom ${LUMO_SHORT_APP_NAME} here.`
            : c('collider_2025:Info').t`We moved your ${customLumoCount} Custom ${LUMO_SHORT_APP_NAME}s here.`;

    return (
        <div className="skills-migration-notice flex flex-nowrap items-start gap-3">
            <LumoIcon aria-hidden className="shrink-0 mt-0.5" name="Sparkles" size={18} />
            <p className="m-0 text-sm flex-1 min-w-0">
                <span className="text-semibold">{c('collider_2025:Info')
                    .t`Custom ${LUMO_SHORT_APP_NAME}s are now Skills`}</span>
                {'. '}
                {movedCountLabel}{' '}
                {c('collider_2025:Info').t`Each one is now a SKILL.md file you can edit and add supporting files to.`}
            </p>
            <button
                type="button"
                className="shrink-0 border-none bg-transparent p-0 cursor-pointer color-weak interactive"
                aria-label={c('collider_2025:Action').t`Dismiss`}
                onClick={handleDismiss}
            >
                <LumoIcon name="X" size={14} />
            </button>
        </div>
    );
};
