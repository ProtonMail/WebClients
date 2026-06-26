import { useState } from 'react';

import { c } from 'ttag';

import { useLumoNavigate } from '../../hooks/useLumoNavigate';
import { hasDismissedPaperTrailPanel, markPaperTrailPanelDismissed } from '../../util/paperTrailPanelStorage';
import NotificationPanel from '../notification/NotificationPanel';

/**
 * The "See your AI paper trail" entry point, surfaced as the shared notification
 * panel (bottom-right) rather than an inline element above the composer.
 */
export default function PaperTrailPanel() {
    const navigate = useLumoNavigate();
    const [dismissed, setDismissed] = useState(hasDismissedPaperTrailPanel);

    if (dismissed) {
        return null;
    }

    return (
        <NotificationPanel
            showNewBadge
            persistDismiss={false}
            title={c('collider_2025:Title').t`See your AI paper trail`}
            text={c('collider_2025:Info')
                .t`Discover what Big Tech AI could piece together about you from your chat history — and get a privacy score you can share.`}
            actionLabel={c('collider_2025:Action').t`Reveal my profile`}
            onAction={() => navigate('/ai-paper-trail')}
            onDismiss={() => {
                markPaperTrailPanelDismissed();
                setDismissed(true);
            }}
        />
    );
}
