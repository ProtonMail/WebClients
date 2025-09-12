import {
    getIsPerfectEmailState,
    getIsPerfectPhoneState,
    getIsPerfectPhraseState,
    getIsPerfectSentinelEmailState,
    getIsPerfectSentinelPhoneState,
} from '@proton/shared/lib/helpers/securityCheckup';
import type { SecurityCheckupAction } from '@proton/shared/lib/interfaces/securityCheckup';
import {
    SecurityCheckupCohort,
    type SecurityCheckupCohortType,
} from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';
import type SecurityState from '@proton/shared/lib/interfaces/securityCheckup/SecurityState';

import { AbstractActions, type IActions } from './Actions';
import type SecurityCheckupHealth from './SecurityCheckupHealth';

class SentinelActions extends AbstractActions implements IActions {
    public actionsSet: Set<SecurityCheckupAction>;

    private securityState: SecurityState;

    private isPerfectPhraseState: boolean;

    private isPerfectSentinelEmailState: boolean;

    private isPerfectSentinelPhoneState: boolean;

    constructor(securityState: SecurityState) {
        super();

        this.actionsSet = new Set<SecurityCheckupAction>();

        this.securityState = securityState;

        this.isPerfectPhraseState = getIsPerfectPhraseState(securityState);
        this.isPerfectSentinelEmailState = getIsPerfectSentinelEmailState(securityState);
        this.isPerfectSentinelPhoneState = getIsPerfectSentinelPhoneState(securityState);
    }

    public phrase() {
        if (!this.securityState.phrase.isAvailable) {
            return;
        }

        if (!this.isPerfectPhraseState) {
            this.actionsSet.add('phrase');
        }
    }

    public email() {
        if (!this.isPerfectSentinelEmailState) {
            this.actionsSet.add('sentinel-email');
        }
    }

    public phone() {
        if (!this.isPerfectSentinelPhoneState) {
            this.actionsSet.add('sentinel-phone');
        }
    }

    public emailOrPhone() {
        this.phone();
        this.email();
    }

    public device() {
        /**
         * Device is not recommended for sentinel since email and phone is not recommended for recovery
         */
    }
}

const getSentinelSecurityCheckupRecommendations = (securityState: SecurityState): SecurityCheckupHealth => {
    const isPerfectPhraseState = getIsPerfectPhraseState(securityState);

    const isPerfectSentinelEmailState = getIsPerfectSentinelEmailState(securityState);
    const isPerfectSentinelPhoneState = getIsPerfectSentinelPhoneState(securityState);

    const isPerfectEmailState = getIsPerfectEmailState(securityState);

    const isPerfectPhoneState = getIsPerfectPhoneState(securityState);

    const isPerfectSentinelEmailOrPhoneState = isPerfectSentinelEmailState || isPerfectSentinelPhoneState;

    const actions = new SentinelActions(securityState);
    const furtherActions = new SentinelActions(securityState);

    const serialize = ({
        cohort,
        actions,
        furtherActions,
    }: {
        cohort: SecurityCheckupCohortType;
        actions: SentinelActions;
        furtherActions: SentinelActions;
    }) => {
        return {
            cohort,
            actions: actions.toArray(),
            furtherActions: furtherActions.toArray(),
        };
    };

    const { phone, email } = securityState;

    /**
     * SENTINEL_RECOMMENDATIONS
     **/
    if (isPerfectPhraseState && (isPerfectEmailState || isPerfectPhoneState)) {
        if (isPerfectPhoneState) {
            actions.phone();
        }
        if (isPerfectEmailState) {
            actions.email();
        }

        return serialize({
            cohort: SecurityCheckupCohort.Sentinel.SENTINEL_RECOMMENDATIONS,
            actions,
            furtherActions,
        });
    }

    /**
     * COMPLETE_RECOVERY
     **/
    if (isPerfectPhraseState && isPerfectSentinelEmailOrPhoneState) {
        furtherActions.email();

        return serialize({
            cohort: SecurityCheckupCohort.Common.COMPLETE_RECOVERY,
            actions,
            furtherActions,
        });
    }

    if (isPerfectPhraseState && !isPerfectSentinelEmailOrPhoneState) {
        if (phone.value && phone.isEnabled) {
            // Prioritise removing the phone
            actions.phone();
        }

        if (email.value && email.isEnabled) {
            actions.email();
        } else if (!(phone.value && phone.isEnabled)) {
            furtherActions.email();
        }

        return serialize({
            cohort: SecurityCheckupCohort.Sentinel.SENTINEL_RECOMMENDATIONS,
            actions,
            furtherActions,
        });
    }

    if (!isPerfectPhraseState && (isPerfectEmailState || isPerfectPhoneState)) {
        actions.phrase();

        return serialize({
            cohort: SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED,
            actions,
            furtherActions,
        });
    }

    if (!isPerfectPhraseState && isPerfectSentinelEmailOrPhoneState) {
        actions.phrase();

        return serialize({
            cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
            actions,
            furtherActions,
        });
    }

    actions.phrase();

    if (phone.value) {
        furtherActions.phone();
    } else {
        furtherActions.email();
    }

    return serialize({
        cohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
        actions,
        furtherActions,
    });
};

export default getSentinelSecurityCheckupRecommendations;
