import { LumoMarkdownCodeBlock } from '../LumoMarkdownCodeBlock';
import { LumoInsightCard } from './LumoInsightCard';
import { LumoMetricCardRow } from './LumoMetricCardRow';
import { isCardRowLanguage } from './detectCardSpec';
import { parseCardRowSegmentCode } from './parseCardRowFence';
import { parseCardSpec } from './parseCardSpec';

interface LumoMarkdownCardBlockProps {
    code: string;
    language: string;
}

export const LumoMarkdownCardBlock = ({ code, language }: LumoMarkdownCardBlockProps) => {
    if (isCardRowLanguage(language)) {
        const cards = parseCardRowSegmentCode(code);
        if (cards && cards.length > 0) {
            return <LumoMetricCardRow cards={cards} />;
        }
    }

    try {
        const spec = parseCardSpec(code);

        return (
            <div className="lumo-insight-card-block w-full my-2 mb-3">
                <LumoInsightCard spec={spec} />
            </div>
        );
    } catch {
        return <LumoMarkdownCodeBlock code={code} language={language || 'card'} />;
    }
};
