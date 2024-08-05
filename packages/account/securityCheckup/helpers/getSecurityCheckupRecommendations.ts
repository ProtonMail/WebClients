import {
    getIsAlmostPerfectEmailState,
    getIsAlmostPerfectPhoneState,
    getIsPerfectDeviceRecoveryState,
    getIsPerfectEmailState,
    getIsPerfectPhoneState,
    getIsPerfectPhraseState,
} from '@proton/shared/lib/helpers/securityCheckup';
import type { SecurityCheckupAction } from '@proton/shared/lib/interfaces/securityCheckup';
import SecurityCheckupCohort from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';
import type SecurityState from '@proton/shared/lib/interfaces/securityCheckup/SecurityState';

class Actions {
    private actionsSet: Set<SecurityCheckupAction>;

    private securityState: SecurityState;

    private isPerfectPhraseState: boolean;

    private isPerfectEmailState: boolean;

    private isPerfectPhoneState: boolean;

    private isPerfectDeviceRecoveryState: boolean;

    public shouldActionDevice: boolean;

    constructor(securityState: SecurityState) {
        this.actionsSet = new Set<SecurityCheckupAction>();

        this.securityState = securityState;

        this.isPerfectPhraseState = getIsPerfectPhraseState(securityState);
        this.isPerfectEmailState = getIsPerfectEmailState(securityState);
        this.isPerfectPhoneState = getIsPerfectPhoneState(securityState);
        this.isPerfectDeviceRecoveryState = getIsPerfectDeviceRecoveryState(securityState);

        this.shouldActionDevice =
            (this.isPerfectEmailState || this.isPerfectPhoneState) && !this.isPerfectDeviceRecoveryState;
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
        if (!this.isPerfectEmailState) {
            this.actionsSet.add('email');
        }
    }

    public phone() {
        if (!this.isPerfectPhoneState) {
            this.actionsSet.add('phone');
        }
    }

    public emailOrPhone() {
        this.email();
        this.phone();
    }

    public device() {
        if (!this.securityState.deviceRecovery.isAvailable) {
            return;
        }

        if (this.shouldActionDevice) {
            this.actionsSet.add('device');
        }
    }

    public toArray() {
        return Array.from(this.actionsSet);
    }
}

interface SecurityCheckupHealth {
    cohort: SecurityCheckupCohort;
    actions: SecurityCheckupAction[];
    furtherActions: SecurityCheckupAction[];
}

const getSecurityCheckupRecommendations = (securityState: SecurityState): SecurityCheckupHealth => {
    const isPerfectPhraseState = getIsPerfectPhraseState(securityState);

    const isPerfectEmailState = getIsPerfectEmailState(securityState);
    const isAlmostPerfectEmailState = getIsAlmostPerfectEmailState(securityState);

    const isPerfectPhoneState = getIsPerfectPhoneState(securityState);
    const isAlmostPerfectPhoneState = getIsAlmostPerfectPhoneState(securityState);

    const isPerfectEmailOrPhoneState = isPerfectEmailState || isPerfectPhoneState;

    const isPerfectDeviceState = getIsPerfectDeviceRecoveryState(securityState);

    const actions = new Actions(securityState);
    const furtherActions = new Actions(securityState);

    const serialize = ({
        cohort,
        actions,
        furtherActions,
    }: {
        cohort: SecurityCheckupCohort;
        actions: Actions;
        furtherActions: Actions;
    }) => {
        return {
            cohort,
            actions: actions.toArray(),
            furtherActions: furtherActions.toArray(),
        };
    };

    /**
     * COMPLETE_RECOVERY_MULTIPLE
     **/
    if (isPerfectPhraseState && isPerfectEmailOrPhoneState && isPerfectDeviceState) {
        actions.device();
        furtherActions.emailOrPhone();

        return serialize({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_MULTIPLE,
            actions,
            furtherActions,
        });
    }

    /**
     * COMPLETE_RECOVERY_SINGLE
     **/
    if (isPerfectPhraseState && !isPerfectEmailOrPhoneState) {
        actions.emailOrPhone();

        return serialize({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_SINGLE,
            actions,
            furtherActions,
        });
    }

    if (isPerfectPhraseState && isPerfectEmailOrPhoneState && !isPerfectDeviceState) {
        actions.device();

        furtherActions.emailOrPhone();

        return serialize({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_SINGLE,
            actions,
            furtherActions,
        });
    }

    if (!isPerfectPhraseState && isPerfectEmailOrPhoneState && isPerfectDeviceState) {
        actions.phrase();

        furtherActions.emailOrPhone();

        return serialize({
            cohort: SecurityCheckupCohort.COMPLETE_RECOVERY_SINGLE,
            actions,
            furtherActions,
        });
    }

    /**
     * ACCOUNT_RECOVERY_ENABLED
     **/
    if (!isPerfectPhraseState && isPerfectEmailOrPhoneState && !isPerfectDeviceState) {
        actions.device();

        furtherActions.phrase();
        furtherActions.emailOrPhone();

        return serialize({
            cohort: SecurityCheckupCohort.ACCOUNT_RECOVERY_ENABLED,
            actions,
            furtherActions,
        });
    }

    /**
     * NO_RECOVERY_METHOD
     **/
    if (isAlmostPerfectEmailState || isAlmostPerfectPhoneState) {
        if (isAlmostPerfectEmailState) {
            actions.email();
        }
        if (isAlmostPerfectPhoneState) {
            actions.phone();
        }
    }

    actions.phrase();

    if (!isAlmostPerfectEmailState) {
        furtherActions.email();
    }

    if (!isAlmostPerfectPhoneState) {
        furtherActions.phone();
    }

    return serialize({
        cohort: SecurityCheckupCohort.NO_RECOVERY_METHOD,
        actions,
        furtherActions,
    });
};

export default getSecurityCheckupRecommendations;
