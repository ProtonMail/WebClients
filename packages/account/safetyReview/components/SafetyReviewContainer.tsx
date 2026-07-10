import { useEffect, useLayoutEffect, useState } from 'react';

import { c } from 'ttag';

import { selectRecoveryState } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { LittleShield } from '@proton/components/containers/recovery/RecoveryScoreBanner/LittleShield';
import { RecoveryScoreBar } from '@proton/components/containers/recovery/RecoveryScoreBanner/RecoveryScoreBar';
import {
    SCORE_TONE_CLASS,
    getRecoveryScoreState,
} from '@proton/components/containers/recovery/RecoveryScoreBanner/recoveryScoreState';
import useApi from '@proton/components/hooks/useApi';
import useAppTitle from '@proton/components/hooks/useAppTitle';
import { useStore } from '@proton/redux-shared-store/sharedProvider';
import { lockSensitiveSettings } from '@proton/shared/lib/api/user';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useSafetyReviewCtrTelemetry } from '../telemetry/useSafetyReviewCtrTelemetry';
import { useSafetyReviewScoreDiffTelemetry } from '../telemetry/useSafetyReviewScoreDiffTelemetry';
import { useSafetyReviewPageLoadTelemetry } from '../telemetry/useSafetyReviewTelemetry';
import { SafetyReviewBackButton, SafetyReviewHeader, SafetyReviewLayout, SafetyReviewLogo } from './SafetyReviewLayout';
import { renderActionItem } from './actions/renderActionItem';
import { introTransition, removeIntroTransition, swipeTransition } from './animations';
import { SafetyReviewCards } from './cards/SafetyReviewCards';
import { getActionableActionItem } from './getActionableActionItem';
import type { SafetyReviewBackLink } from './getSafetyReviewBackLink';
import type {
    PartialSafetyReviewContainerState,
    SafetyReviewContainerActions,
    SafetyReviewContainerProps,
    SafetyReviewContainerState,
} from './interface';

const getSafetyReviewState = (
    store: ReturnType<typeof useStore>,
    actionsHistoryMap: SafetyReviewContainerState['actionsHistoryMap']
): PartialSafetyReviewContainerState => {
    // Intentionally taking snapshots of the recovery state to avoid cards appearing/disappearing while performing specific actions.
    const recoveryState = selectRecoveryState(store.getState());
    const actionableRecoveryActionItems = recoveryState.recoveryActionItems.filter((item) =>
        getActionableActionItem(item, actionsHistoryMap)
    );
    const visibleActionableRecoveryActionItems = actionableRecoveryActionItems.slice(0, 3);
    return {
        recoveryState,
        actionableRecoveryActionItems,
        visibleActionableRecoveryActionItems,
        remainingItems: actionableRecoveryActionItems.length,
        actionsHistoryMap,
    };
};

export const SafetyReviewContainer = ({ backLink }: { backLink: SafetyReviewBackLink }) => {
    const api = useApi();
    const store = useStore();

    useAppTitle(c('Safety review').t`Safety review`);

    useEffect(() => {
        return () => {
            // Several actions persist password scope, this ensures it gets locked navigating away from the page
            api(lockSensitiveSettings()).catch(noop);
        };
    }, []);

    const [state, setState] = useState<PartialSafetyReviewContainerState>(() => {
        return getSafetyReviewState(store, new Map());
    });
    const [stackContentReady, setStackContentReady] = useState(false);
    const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);

    useSafetyReviewPageLoadTelemetry();
    useSafetyReviewScoreDiffTelemetry({
        score: state.recoveryState.recoveryScore.score,
        loading: state.recoveryState.loading,
    });
    const { sendStepSkip, sendStepSuccess } = useSafetyReviewCtrTelemetry({
        activeStep: state.visibleActionableRecoveryActionItems[0],
    });

    useLayoutEffect(() => {
        introTransition(() => {
            setStackContentReady(true);
        });
        return () => {
            removeIntroTransition();
        };
    }, []);

    const safetyReviewContainerActions: SafetyReviewContainerActions = {
        next: (type, item) => {
            if (type === 'completed') {
                sendStepSuccess(item.id);
            }
            if (type === 'skipped') {
                sendStepSkip(item.id);
            }

            swipeTransition({
                visibleItems: state.visibleActionableRecoveryActionItems,
                type,
                update: () => {
                    setState((oldState) => {
                        // Reuse the old map. Fine because it's not used in render.
                        oldState.actionsHistoryMap.set(item.id, {
                            type,
                        });
                        return getSafetyReviewState(store, oldState.actionsHistoryMap);
                    });
                },
            });
        },
        restart: () => {
            setStackContentReady(false);
            removeIntroTransition();
            introTransition(() => {
                setState(getSafetyReviewState(store, new Map()));
                setStackContentReady(true);
            });
        },
    };

    const safetyReviewContainerState: SafetyReviewContainerState = {
        ...state,
        backLink,
    };

    const safetyReviewProps: SafetyReviewContainerProps = {
        footerEl,
        safetyReview: {
            state: safetyReviewContainerState,
            actions: safetyReviewContainerActions,
        },
    };

    const recoveryScore = state.recoveryState.recoveryScore;
    const recoveryScoreState = getRecoveryScoreState(recoveryScore.score);

    return (
        <SafetyReviewLayout
            header={
                <SafetyReviewHeader
                    logo={<SafetyReviewLogo backLink={safetyReviewContainerState.backLink} />}
                    backButton={<SafetyReviewBackButton backLink={safetyReviewContainerState.backLink} />}
                />
            }
        >
            <SafetyReviewCards
                stackContentReady={stackContentReady}
                header={
                    <div className="w-full safety-review-entrance-animation mb-4">
                        <div className="mb-2 flex w-full justify-space-between items-center gap-2">
                            <h3 className="m-0 text-semibold text-rg">{c('safety_review').t`Account protection`}</h3>
                            <div className="flex items-center gap-2 flex-nowrap">
                                <span
                                    className={clsx('text-semibold text-rg', SCORE_TONE_CLASS[recoveryScoreState.tone])}
                                >
                                    {recoveryScoreState.label}
                                </span>
                                <LittleShield
                                    score={recoveryScore.score}
                                    toneClass={SCORE_TONE_CLASS[recoveryScoreState.tone]}
                                />
                            </div>
                        </div>
                        <RecoveryScoreBar
                            score={recoveryScore.score}
                            maxScore={recoveryScore.maxScore}
                            scoreTone={recoveryScoreState.tone}
                            style={{
                                '--background-weak': 'color-mix(in srgb, var(--background-invert) 10%, transparent)',
                            }}
                        />
                    </div>
                }
                footer={<div ref={setFooterEl}></div>}
                items={state.visibleActionableRecoveryActionItems}
                renderItem={(item, props) => {
                    return renderActionItem(item, props, safetyReviewProps);
                }}
            />
        </SafetyReviewLayout>
    );
};
