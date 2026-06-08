import { c } from 'ttag';

import { selectRecoveryState } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import clsx from '@proton/utils/clsx';

import { RecoveryScoreBar } from './RecoveryScoreBar';
import RecoveryScoreModal from './RecoveryScoreModal';
import { RecoveryScoreShield } from './RecoveryScoreShield';
import SecureAccountButton from './SecureAccountButton';
import {
    SCORE_TONE_CLASS,
    getRecoveryScoreCta,
    getRecoveryScoreHint,
    getRecoveryScoreState,
    getRecoveryScoreTitle,
} from './recoveryScoreStateV2';

import './RecoveryScoreBannerV2.scss';

const RecoveryScoreBanner = () => {
    const {
        loading,
        recoveryScore: { score, maxScore },
    } = useSelector(selectRecoveryState);
    const { label: scoreLabel, tone: scoreTone } = getRecoveryScoreState(score);
    const scoreHint = getRecoveryScoreHint(score);
    const scoreTitle = getRecoveryScoreTitle(score);
    const [modalProps, setModalOpen, renderModal] = useModalState();

    const isMaximumScore = score >= maxScore;

    return (
        <section className="rounded-xl bg-elevated shadow-norm flex flex-column relative overflow-hidden">
            {renderModal && <RecoveryScoreModal {...modalProps} />}
            {loading && (
                <div
                    className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
                    style={{
                        backdropFilter: 'blur(30px)',
                        background: 'color-mix(in srgb, var(--background-elevated) 50%, transparent)',
                    }}
                >
                    <CircleLoader />
                </div>
            )}
            <div className="flex flex-row justify-start gap-8 flex-nowrap p-4">
                <div className="shrink-0">
                    <button
                        onClick={() => setModalOpen(true)}
                        type="button"
                        aria-label={c('Action').t`View recovery setup details`}
                        className={clsx(
                            'relative recovery-score-accent recovery-score-banner-shield-button',
                            `recovery-score-accent-${SCORE_TONE_CLASS[scoreTone]}`
                        )}
                    >
                        <RecoveryScoreShield
                            score={score}
                            maxScore={maxScore}
                            toneClass={SCORE_TONE_CLASS[scoreTone]}
                        />
                    </button>
                </div>

                <div className="min-w-0 lg:flex-1">
                    <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
                        <h2 className="m-0 text-semibold text-rg">{c('Recovery score').t`Recoverability`}</h2>
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
                </div>
            </div>

            <div className="p-4 border-top border-weak flex flex-column gap-2">
                <h3 className="m-0 text-semibold text-lg">{scoreTitle}</h3>
                <p className="m-0 text-sm">{scoreHint}</p>
                {!isMaximumScore && (
                    <div className="shrink-0 mt-1">
                        <SecureAccountButton
                            scoreTone={scoreTone}
                            label={getRecoveryScoreCta(score)}
                            className="w-full lg:w-auto"
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export default RecoveryScoreBanner;
