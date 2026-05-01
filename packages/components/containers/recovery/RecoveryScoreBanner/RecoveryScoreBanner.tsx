import { c } from 'ttag';

import { useRecoveryScore } from '@proton/account/securityCheckup/recoveryScore/useRecoveryScore';
import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import clsx from '@proton/utils/clsx';

import RecoveryScoreModal from './RecoveryScoreModal';
import SecureAccountButton from './SecureAccountButton';
import { Shield } from './Shield';
import {
    SCORE_TONE_BG_CLASS,
    SCORE_TONE_CLASS,
    getRecoveryScoreHint,
    getRecoveryScoreState,
} from './recoveryScoreState';

import './RecoveryScoreBanner.scss';

const RecoveryScoreBanner = () => {
    const { score, maxScore } = useRecoveryScore();
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
                    <Shield score={score} maxScore={maxScore} toneClass={SCORE_TONE_CLASS[scoreTone]} />
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

                <div className="mb-3 flex gap-1 h-custom" style={{ '--h-custom': '0.1875rem' }}>
                    {Array.from({ length: maxScore }, (_, index) => (
                        <div
                            key={index}
                            className={clsx(
                                'h-full flex-1 rounded-full',
                                index < score ? SCORE_TONE_BG_CLASS[scoreTone] : 'bg-weak'
                            )}
                        />
                    ))}
                </div>

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
