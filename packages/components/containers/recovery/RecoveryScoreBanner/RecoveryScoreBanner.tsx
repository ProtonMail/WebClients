import { c } from 'ttag';

import { selectRecoveryState } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import clsx from '@proton/utils/clsx';

import { RecoveryScoreBar } from './RecoveryScoreBar';
import RecoveryScoreModal from './RecoveryScoreModal';
import { RecoveryScoreShield } from './RecoveryScoreShield';
import SecureAccountButton from './SecureAccountButton';
import { SCORE_TONE_CLASS, getRecoveryScoreHint, getRecoveryScoreState } from './recoveryScoreState';

import './RecoveryScoreBanner.scss';

const RecoveryScoreBanner = () => {
    const {
        recoveryScore: { score, maxScore },
    } = useSelector(selectRecoveryState);
    const { label: scoreLabel, tone: scoreTone } = getRecoveryScoreState(score);
    const scoreHint = getRecoveryScoreHint(score);
    const [modalProps, setModalOpen, renderModal] = useModalState();

    const isMaximumScore = score >= maxScore;

    return (
        <section className="rounded-xl bg-elevated p-4 shadow-norm flex flex-column gap-2 lg:flex-row lg:items-center lg:gap-8 text-center lg:text-left lg:pr-8">
            {renderModal && <RecoveryScoreModal {...modalProps} />}
            <div className="shrink-0">
                <button
                    onClick={() => setModalOpen(true)}
                    type="button"
                    aria-label={c('Action').t`View recovery setup details`}
                    className={clsx(
                        'relative recovery-score-accent recovery-score-banner-shield-button relative',
                        `recovery-score-accent-${SCORE_TONE_CLASS[scoreTone]}`
                    )}
                >
                    <RecoveryScoreShield score={score} maxScore={maxScore} toneClass={SCORE_TONE_CLASS[scoreTone]} />
                </button>
            </div>

            <div className="min-w-0 lg:flex-1">
                <div className="mb-2 flex flex-wrap items-baseline gap-x-2 justify-center lg:justify-start">
                    <h2 className="m-0 text-semibold text-rg">{c('Recovery score').t`Account protection`}</h2>
                    <Button
                        size="small"
                        shape="ghost"
                        className={clsx(
                            'text-semibold interactive inline-flex items-center gap-2',
                            SCORE_TONE_CLASS[scoreTone]
                        )}
                        onClick={() => setModalOpen(true)}
                        aria-label={c('Action').t`View recovery setup details`}
                    >
                        {scoreLabel} <IcInfoCircle className="shrink-0" />
                    </Button>
                </div>

                <RecoveryScoreBar score={score} maxScore={maxScore} scoreTone={scoreTone} />

                <p className="m-0 text-sm">{scoreHint}</p>
            </div>

            {!isMaximumScore && (
                <div className="shrink-0 lg:self-center">
                    <SecureAccountButton scoreTone={scoreTone} className="w-full lg:w-auto" />
                </div>
            )}
        </section>
    );
};

export default RecoveryScoreBanner;
