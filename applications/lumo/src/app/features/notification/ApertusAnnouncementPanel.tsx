import { c } from 'ttag';

import { useModelTier } from '../../providers/ModelTierProvider';
import NotificationPanel from './NotificationPanel';

interface ApertusAnnouncementPanelProps {
    onDismiss: () => void;
}

export default function ApertusAnnouncementPanel({ onDismiss }: ApertusAnnouncementPanelProps) {
    const { setModelTier } = useModelTier();

    return (
        <NotificationPanel
            showNewBadge
            persistDismiss={false}
            title={c('collider_2025: Title').t`Meet Apertus 1.5`}
            text={c('collider_2025: Description')
                .t`Try the new fully open, Swiss-made AI model developed with leading Swiss research institutions.`}
            actionLabel={c('collider_2025: Action').t`Try Apertus`}
            onAction={() => setModelTier('apertus-15')}
            onDismiss={onDismiss}
        />
    );
}
