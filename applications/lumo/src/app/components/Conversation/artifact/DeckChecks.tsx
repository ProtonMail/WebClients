import { c, msgid } from 'ttag';

import type { UnsourcedNumber } from '../../../util/slides/checks/dataChecks';
import { LumoIcon } from '../../LumoIcon/LumoIcon';

/**
 * What the user should check before sharing a deck: numbers that aren't in their messages, files
 * or web results, numbers the model says it calculated, and information it reported missing.
 * Shown above the slides; nothing here changes the file.
 */

interface FindingListProps {
    findings: UnsourcedNumber[];
    slideNumberFor: (sourceSlide: number) => number;
}

const FindingList = ({ findings, slideNumberFor }: FindingListProps) => {
    return (
        <ul className="m-0 mt-1 pl-4">
            {findings.map((finding, index) => {
                const slideNumber = slideNumberFor(finding.sourceSlide);
                return (
                    <li key={index}>
                        <span className="text-semibold">{finding.value}</span>
                        {` · ${c('collider_2025: Info').t`slide ${slideNumber}`}, ${finding.where}`}
                        {finding.calculatedAs && <span className="color-weak">{` · ${finding.calculatedAs}`}</span>}
                    </li>
                );
            })}
        </ul>
    );
};

interface Props {
    findings: UnsourcedNumber[];
    gaps: string[];
    /** Maps a deck slide to the number it has in the preview, which differs once long slides are split. */
    slideNumberFor: (sourceSlide: number) => number;
}

export const DeckChecks = ({ findings, gaps, slideNumberFor }: Props) => {
    const unsourced = findings.filter((finding) => {
        return !finding.calculatedAs;
    });
    const calculated = findings.filter((finding) => {
        return Boolean(finding.calculatedAs);
    });
    if (unsourced.length === 0 && calculated.length === 0 && gaps.length === 0) {
        return null;
    }
    const unsourcedCount = unsourced.length;
    const calculatedCount = calculated.length;

    return (
        <div className="flex flex-column gap-2 text-sm">
            {unsourcedCount > 0 && (
                <div className="flex flex-row flex-nowrap gap-2 p-3 rounded border border-weak bg-weak">
                    <LumoIcon name="TriangleAlert" size={16} className="shrink-0 mt-0.5 color-warning" />
                    <details className="min-w-0">
                        <summary className="cursor-pointer">
                            {c('collider_2025: Info').ngettext(
                                msgid`${unsourcedCount} number isn't in your messages, files or web results. Check it before you share.`,
                                `${unsourcedCount} numbers aren't in your messages, files or web results. Check them before you share.`,
                                unsourcedCount
                            )}
                        </summary>
                        <FindingList findings={unsourced} slideNumberFor={slideNumberFor} />
                    </details>
                </div>
            )}
            {calculatedCount > 0 && (
                <div className="flex flex-row flex-nowrap gap-2 p-3 rounded border border-weak">
                    <LumoIcon name="Calculator" size={16} className="shrink-0 mt-0.5 color-weak" />
                    <details className="min-w-0">
                        <summary className="cursor-pointer">
                            {c('collider_2025: Info').ngettext(
                                msgid`${calculatedCount} number was calculated from your material.`,
                                `${calculatedCount} numbers were calculated from your material.`,
                                calculatedCount
                            )}
                        </summary>
                        <FindingList findings={calculated} slideNumberFor={slideNumberFor} />
                    </details>
                </div>
            )}
            {gaps.length > 0 && (
                <div className="flex flex-row flex-nowrap gap-2 p-3 rounded border border-weak">
                    <LumoIcon name="Info" size={16} className="shrink-0 mt-0.5 color-weak" />
                    <div className="min-w-0">
                        {c('collider_2025: Info').t`Missing information:`}
                        <ul className="m-0 mt-1 pl-4">
                            {gaps.map((gap, index) => {
                                return <li key={index}>{gap}</li>;
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
