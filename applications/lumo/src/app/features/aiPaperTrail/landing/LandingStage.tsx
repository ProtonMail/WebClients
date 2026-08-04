import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { DEMO_SHARE_CARD_DATA } from '../demoShareCardData';
import { ShareCardCanvasPreview } from '../shareCard/ShareCardCanvasPreview';
import { RecentFilesSection } from './RecentFilesSection';

interface Props {
    onGenerate: () => void;
    recentFilesRefreshKey: number;
    onOpenReport: (id: string) => void;
    onDeleteReport: (id: string) => void;
}

export const LandingStage = ({ onGenerate, recentFilesRefreshKey, onOpenReport, onDeleteReport }: Props) => {
    return (
        <div className="ai-paper-trail__inner ai-paper-trail__landing-split">
            <div className="ai-paper-trail__landing-copy">
                <h1 className="ai-paper-trail__title ai-paper-trail__landing-title">
                    {c('collider_2025:Title').t`See what Big Tech AI already knows about you`}
                </h1>
                <div className="flex flex-column gap-5 mb-5">
                    <p className="color-hint m-0">
                        {c('collider_2025:Info')
                            .t`Every conversation with the big AI providers leaves a digital paper trail. Your job. Your health. Your relationships. Even where you live.`}
                    </p>
                    <p className="color-hint m-0">
                        {c('collider_2025:Info')
                            .t`Export your data from your Chat GPT or Claude, upload it securely, and we'll show you what big tech AI can infer about you.`}
                    </p>
                </div>
                <Button color="norm" size="large" pill onClick={onGenerate}>
                    {c('collider_2025:Action').t`Generate my report`}
                </Button>
            </div>
            <div className="ai-paper-trail__landing-preview" aria-hidden="true">
                <ShareCardCanvasPreview
                    data={DEMO_SHARE_CARD_DATA}
                    theme="light"
                    hideFooter
                    className="ai-paper-trail__landing-card"
                />
            </div>
            <RecentFilesSection
                refreshKey={recentFilesRefreshKey}
                onOpenReport={onOpenReport}
                onDeleteReport={onDeleteReport}
            />
        </div>
    );
};
