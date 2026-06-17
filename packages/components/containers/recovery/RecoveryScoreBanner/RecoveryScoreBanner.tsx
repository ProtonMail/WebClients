import { c } from 'ttag';

import { selectRecoveryState } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import useConfig from '@proton/components/hooks/useConfig';
import { SkeletonLoader } from '@proton/components/index';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { APPS } from '@proton/shared/lib/constants';
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
} from './recoveryScoreState';

import './RecoveryScoreBanner.scss';

interface Props {
    variant: SettingsLayoutVariant;
}
const RecoveryScoreBanner = ({ variant }: Props) => {
    const { APP_NAME } = useConfig();
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
        <section
            className={clsx(
                'rounded-xl bg-elevated flex flex-column relative overflow-hidden',
                variant !== SettingsLayoutVariant.Mobile && 'shadow-norm'
            )}
        >
            {renderModal && <RecoveryScoreModal {...modalProps} />}
            <div className="flex flex-row justify-start items-center gap-4 flex-nowrap p-4">
                <div className="shrink-0">
                    <button
                        onClick={() => setModalOpen(true)}
                        type="button"
                        aria-label={c('Action').t`View recovery setup details`}
                        className={clsx(
                            'relative recovery-score-accent recovery-score-banner-shield-button',
                            `recovery-score-accent-${SCORE_TONE_CLASS[scoreTone]}`
                        )}
                        disabled={loading}
                    >
                        <RecoveryScoreShield
                            loading={loading}
                            score={score}
                            maxScore={maxScore}
                            toneClass={SCORE_TONE_CLASS[scoreTone]}
                        />
                    </button>
                </div>

                <div className="min-w-0 lg:flex-1 lg:mr-2">
                    <div className="mb-2 flex flex-wrap items-center gap-x-2">
                        <h2 className="m-0 text-semibold text-rg">{c('Recovery score').t`Recoverability`}</h2>
                        {loading ? (
                            <SkeletonLoader width="5.275rem" height="1.75rem" />
                        ) : (
                            <Button
                                size="small"
                                shape="ghost"
                                className={clsx(
                                    'text-semibold interactive inline-flex items-center gap-2 fade-in',
                                    SCORE_TONE_CLASS[scoreTone]
                                )}
                                onClick={() => setModalOpen(true)}
                                aria-label={c('Action').t`View recovery setup details`}
                            >
                                {scoreLabel} <IcInfoCircle className="shrink-0" />
                            </Button>
                        )}
                    </div>

                    <RecoveryScoreBar score={score} maxScore={maxScore} scoreTone={scoreTone} loading={loading} />
                </div>
            </div>

            {!isMaximumScore && (
                <div className="p-4 border-top border-weak flex flex-column gap-2">
                    {loading ? (
                        <SkeletonLoader width="10rem" height="1.428rem" />
                    ) : (
                        <h3 className="m-0 text-semibold text-lg fade-in">{scoreTitle}</h3>
                    )}
                    {loading ? (
                        <SkeletonLoader width="16rem" height="1.071rem" />
                    ) : (
                        <p className="m-0 text-sm fade-in">{scoreHint}</p>
                    )}
                    {APP_NAME !== APPS.PROTONACCOUNTLITE && (
                        <div className="shrink-0 mt-1 fade-in">
                            {loading ? (
                                <SkeletonLoader width="11.085rem" height="2.25rem" />
                            ) : (
                                <SecureAccountButton
                                    scoreTone={scoreTone}
                                    label={getRecoveryScoreCta(score)}
                                    className="w-full lg:w-auto"
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default RecoveryScoreBanner;
