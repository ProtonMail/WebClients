import { c } from 'ttag';

import type { SafetyReviewContainerProps } from '@proton/account/safetyReview/components/interface';
import type { RecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { RecoveryScoreShield } from '@proton/components/containers/recovery/RecoveryScoreBanner/RecoveryScoreShield';
import {
    SCORE_TONE_CLASS,
    getRecoveryScoreState,
} from '@proton/components/containers/recovery/RecoveryScoreBanner/recoveryScoreState';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcCircleRadioEmpty } from '@proton/icons/icons/IcCircleRadioEmpty';

import { NegativeCongratulationsCta, PositiveCongratulationsCta } from './CongratulationsCta';
import { getNegativeRecoveryActionItemCopy, getPositiveRecoveryActionItemCopy } from './getRecoveryActionItemCopy';

type Props = SafetyReviewContainerProps;
export const Congratulations = (props: Props) => {
    const recoveryState = props.safetyReview.state.recoveryState;
    const { maxScore, score } = recoveryState.recoveryScore;
    const { tone: scoreTone } = getRecoveryScoreState(score);

    const actions = props.safetyReview.state.actionsHistoryMap
        .entries()
        .reduce<{ completed: RecoveryActionItem[]; skipped: RecoveryActionItem[] }>(
            (acc, [id, { type }]) => {
                const recoveryActionItem = recoveryState.recoveryActionItems.find((item) => item.id === id);
                if (!recoveryActionItem) {
                    return acc;
                }
                if (type === 'completed') {
                    acc.completed.push(recoveryActionItem);
                } else if (type === 'skipped') {
                    acc.skipped.push(recoveryActionItem);
                }
                return acc;
            },
            { completed: [], skipped: [] }
        );

    if (actions.completed.length > 0) {
        return (
            <div>
                <div className="text-center mb-8">
                    <div className="mb-4">
                        <span style={{ fontSize: '5rem' }}>🎉</span>
                    </div>
                    <h1 className="text-lg text-semibold mb-2">{c('safety_review').t`Congratulations`}</h1>
                </div>
                <div>
                    <div className="mb-2">
                        {c('safety_review').t`Here's how you increased your account protection:`}
                    </div>
                    <ul className="unstyled m-0">
                        {actions.completed.map((item) => (
                            <li key={item.id} className="flex items-center gap-2 py-1">
                                <IcCheckmarkCircleFilled size={4} className="shrink-0 color-success" />
                                <span className="text-sm">{getPositiveRecoveryActionItemCopy(item)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <PositiveCongratulationsCta {...props} />
            </div>
        );
    }

    return (
        <div>
            <div className="text-center mb-8">
                <div className="mb-4">
                    <RecoveryScoreShield score={score} maxScore={maxScore} toneClass={SCORE_TONE_CLASS[scoreTone]} />
                </div>
                <h1 className="text-lg text-semibold mb-2">{c('safety_review').t`Your security setup`}</h1>
            </div>
            <div className="mb-2">{c('Recovery score').t`Add more options for stronger protection`}</div>
            <ul className="unstyled m-0">
                {actions.skipped.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 py-1">
                        <IcCircleRadioEmpty className="shrink-0 color-hint" />
                        <span>{getNegativeRecoveryActionItemCopy(item)}</span>
                    </li>
                ))}
            </ul>

            <NegativeCongratulationsCta {...props} onClick={props.safetyReview.actions.restart} />
        </div>
    );
};
