import { SECOND } from '@proton/shared/lib/constants';

import { METRICS_BATCH_SIZE, METRICS_REQUEST_FREQUENCY_SECONDS } from './constants';
import Counter from './lib/Counter';
import MetricsApi from './lib/MetricsApi';
import MetricsBase from './lib/MetricsBase';
import MetricsRequestService from './lib/MetricsRequestService';
import IMetricsRequestService from './lib/types/IMetricsRequestService';
import { WebCoreSessionRecoveryAbortTotal } from './types/web_core_session_recovery_abort_total_v1.schema';
import { WebCoreSessionRecoveryCancellationModalLoadTotal } from './types/web_core_session_recovery_cancellation_modal_load_total_v1.schema';
import { WebCoreSessionRecoveryConsumeTotal } from './types/web_core_session_recovery_consume_total_v1.schema';
import { WebCoreSessionRecoveryInitiationModalLoadTotal } from './types/web_core_session_recovery_initiation_modal_load_total_v1.schema';
import { WebCoreSessionRecoveryInitiationTotal } from './types/web_core_session_recovery_initiation_total_v1.schema';
import { WebCoreSessionRecoveryPasswordResetAvailableAccountModalLoadTotal } from './types/web_core_session_recovery_password_reset_available_account_modal_load_total_v1.schema';
import { WebCoreSessionRecoverySettingsUpdateTotal } from './types/web_core_session_recovery_settings_update_total_v1.schema';
import { WebCoreSignupAccountStepAccountCreationTotal } from './types/web_core_signup_accountStep_accountCreation_total_v2.schema.d';
import { WebCoreSignupBackButtonTotal } from './types/web_core_signup_backButton_total_v1.schema.d';
import { WebCoreSignupCongratulationsStepDisplayNameChoiceTotal } from './types/web_core_signup_congratulationsStep_displayNameChoice_total_v2.schema.d';
import { WebCoreSignupExploreStepLoginTotal } from './types/web_core_signup_exploreStep_login_total_v2.schema.d';
import { WebCoreSignupLoadingStepAccountSetupTotal } from './types/web_core_signup_loadingStep_accountSetup_total_v2.schema.d';
import { WebCoreSignupPageLoadTotal } from './types/web_core_signup_pageLoad_total_v1.schema.d';
import { WebCoreSignupPaymentStepPaymentTotal } from './types/web_core_signup_paymentStep_payment_total_v2.schema.d';
import { WebCoreSignupRecoveryStepSetRecoveryMethodTotal } from './types/web_core_signup_recoveryStep_setRecoveryMethod_total_v2.schema.d';
import { WebCoreSignupReferralStepPlanSelectionTotal } from './types/web_core_signup_referralStep_planSelection_total_v2.schema.d';
import { WebCoreSignupUpsellStepPlanSelectionTotal } from './types/web_core_signup_upsellStep_planSelection_total_v2.schema.d';
import { WebCoreSignupVerificationStepVerificationTotal } from './types/web_core_signup_verificationStep_verification_total_v2.schema.d';
import { WebCoreVpnSingleSignupFetchDependencies2Total } from './types/web_core_vpn_single_signup_fetchDependencies_2_total_v1.schema';
import { WebCoreVpnSingleSignupPageLoad2Total } from './types/web_core_vpn_single_signup_pageLoad_2_total_v1.schema';
import { WebCoreVpnSingleSignupPasswordSelectionStep2Total } from './types/web_core_vpn_single_signup_passwordSelection_step_2_total_v1.schema';
import { WebCoreVpnSingleSignupStep1AccountCreation2Total } from './types/web_core_vpn_single_signup_step1_accountCreation_2_total_v1.schema';
import { WebCoreVpnSingleSignupStep1CurrencyChange2Total } from './types/web_core_vpn_single_signup_step1_currencyChange_2_total_v1.schema';
import { WebCoreVpnSingleSignupStep1CycleChange2Total } from './types/web_core_vpn_single_signup_step1_cycleChange_2_total_v1.schema';
import { WebCoreVpnSingleSignupStep1Interaction2Total } from './types/web_core_vpn_single_signup_step1_interaction_2_total_v1.schema';
import { WebCoreVpnSingleSignupStep1Payment2Total } from './types/web_core_vpn_single_signup_step1_payment_2_total_v1.schema';
import { WebCoreVpnSingleSignupStep2Setup3Total } from './types/web_core_vpn_single_signup_step2_setup_3_total_v1.schema';
import { WebCoreVpnSingleSignupStep3Complete2Total } from './types/web_core_vpn_single_signup_step3_complete_2_total_v1.schema';
import { WebCoreVpnSingleSignupStep4OrgSetupTotal } from './types/web_core_vpn_single_signup_step4_orgSetup_total_v1.schema';
import { WebCoreVpnSingleSignupStep4Setup2Total } from './types/web_core_vpn_single_signup_step4_setup_2_total_v1.schema';
import { WebCryptoKeyTransparencyErrorsTotal } from './types/web_crypto_keytransparency_errors_total_v1.schema';
import { WebPaymentsSubscriptionStepsTotal } from './types/web_payments_subscription_steps_total_v1.schema';
import { WebPaymentsSubscriptionTotal } from './types/web_payments_subscription_total_v1.schema';

export * from './lib/observeApiError';
export { default as observeApiError } from './lib/observeApiError';

class Metrics extends MetricsBase {
    public core_signup_pageLoad_total: Counter<WebCoreSignupPageLoadTotal>;

    public core_signup_accountStep_accountCreation_total: Counter<WebCoreSignupAccountStepAccountCreationTotal>;

    public core_signup_verificationStep_verification_total: Counter<WebCoreSignupVerificationStepVerificationTotal>;

    public core_signup_upsellStep_planSelection_total: Counter<WebCoreSignupUpsellStepPlanSelectionTotal>;

    public core_signup_paymentStep_payment_total: Counter<WebCoreSignupPaymentStepPaymentTotal>;

    public core_signup_loadingStep_accountSetup_total: Counter<WebCoreSignupLoadingStepAccountSetupTotal>;

    public core_signup_congratulationsStep_displayNameChoice_total: Counter<WebCoreSignupCongratulationsStepDisplayNameChoiceTotal>;

    public core_signup_exploreStep_login_total: Counter<WebCoreSignupExploreStepLoginTotal>;

    public core_signup_recoveryStep_setRecoveryMethod_total: Counter<WebCoreSignupRecoveryStepSetRecoveryMethodTotal>;

    public core_signup_referralStep_planSelection_total: Counter<WebCoreSignupReferralStepPlanSelectionTotal>;

    public core_signup_backButton_total: Counter<WebCoreSignupBackButtonTotal>;

    public core_vpn_single_signup_pageLoad_2_total: Counter<WebCoreVpnSingleSignupPageLoad2Total>;

    public core_vpn_single_signup_fetchDependencies_2_total: Counter<WebCoreVpnSingleSignupFetchDependencies2Total>;

    public core_vpn_single_signup_step1_accountCreation_2_total: Counter<WebCoreVpnSingleSignupStep1AccountCreation2Total>;

    public core_vpn_single_signup_step1_interaction_2_total: Counter<WebCoreVpnSingleSignupStep1Interaction2Total>;

    public core_vpn_single_signup_step1_currencyChange_2_total: Counter<WebCoreVpnSingleSignupStep1CurrencyChange2Total>;

    public core_vpn_single_signup_step1_cycleChange_2_total: Counter<WebCoreVpnSingleSignupStep1CycleChange2Total>;

    public core_vpn_single_signup_step1_payment_2_total: Counter<WebCoreVpnSingleSignupStep1Payment2Total>;

    public core_vpn_single_signup_step2_setup_3_total: Counter<WebCoreVpnSingleSignupStep2Setup3Total>;

    public core_vpn_single_signup_passwordSelection_step_2_total: Counter<WebCoreVpnSingleSignupPasswordSelectionStep2Total>;

    public core_vpn_single_signup_step3_complete_2_total: Counter<WebCoreVpnSingleSignupStep3Complete2Total>;

    public core_vpn_single_signup_step4_setup_2_total: Counter<WebCoreVpnSingleSignupStep4Setup2Total>;

    public core_vpn_single_signup_step4_orgSetup_total: Counter<WebCoreVpnSingleSignupStep4OrgSetupTotal>;

    public payments_subscription_steps_total: Counter<WebPaymentsSubscriptionStepsTotal>;

    public payments_subscription_total: Counter<WebPaymentsSubscriptionTotal>;

    public core_session_recovery_initiation_modal_load_total: Counter<WebCoreSessionRecoveryInitiationModalLoadTotal>;

    public core_session_recovery_initiation_total: Counter<WebCoreSessionRecoveryInitiationTotal>;

    public core_session_recovery_abort_total: Counter<WebCoreSessionRecoveryAbortTotal>;

    public core_session_recovery_cancellation_modal_load_total: Counter<WebCoreSessionRecoveryCancellationModalLoadTotal>;

    public core_session_recovery_consume_total: Counter<WebCoreSessionRecoveryConsumeTotal>;

    public core_session_recovery_password_reset_available_account_modal_load_total: Counter<WebCoreSessionRecoveryPasswordResetAvailableAccountModalLoadTotal>;

    public core_session_recovery_settings_update_total: Counter<WebCoreSessionRecoverySettingsUpdateTotal>;

    public crypto_keytransparency_errors_total: Counter<WebCryptoKeyTransparencyErrorsTotal>;

    constructor(requestService: IMetricsRequestService) {
        super(requestService);

        this.core_signup_pageLoad_total = new Counter<WebCoreSignupPageLoadTotal>(
            { name: 'web_core_signup_pageLoad_total', version: 1 },
            this.requestService
        );
        this.core_signup_accountStep_accountCreation_total = new Counter<WebCoreSignupAccountStepAccountCreationTotal>(
            { name: 'web_core_signup_accountStep_accountCreation_total', version: 2 },
            this.requestService
        );
        this.core_signup_verificationStep_verification_total =
            new Counter<WebCoreSignupVerificationStepVerificationTotal>(
                { name: 'web_core_signup_verificationStep_verification_total', version: 2 },
                this.requestService
            );
        this.core_signup_upsellStep_planSelection_total = new Counter<WebCoreSignupUpsellStepPlanSelectionTotal>(
            { name: 'web_core_signup_upsellStep_planSelection_total', version: 2 },
            this.requestService
        );
        this.core_signup_paymentStep_payment_total = new Counter<WebCoreSignupPaymentStepPaymentTotal>(
            { name: 'web_core_signup_paymentStep_payment_total', version: 2 },
            this.requestService
        );
        this.core_signup_loadingStep_accountSetup_total = new Counter<WebCoreSignupLoadingStepAccountSetupTotal>(
            { name: 'web_core_signup_loadingStep_accountSetup_total', version: 2 },
            this.requestService
        );
        this.core_signup_congratulationsStep_displayNameChoice_total =
            new Counter<WebCoreSignupCongratulationsStepDisplayNameChoiceTotal>(
                { name: 'web_core_signup_congratulationsStep_displayNameChoice_total', version: 2 },
                this.requestService
            );
        this.core_signup_exploreStep_login_total = new Counter<WebCoreSignupExploreStepLoginTotal>(
            { name: 'web_core_signup_exploreStep_login_total', version: 2 },
            this.requestService
        );
        this.core_signup_recoveryStep_setRecoveryMethod_total =
            new Counter<WebCoreSignupRecoveryStepSetRecoveryMethodTotal>(
                { name: 'web_core_signup_recoveryStep_setRecoveryMethod_total', version: 2 },
                this.requestService
            );
        this.core_signup_referralStep_planSelection_total = new Counter<WebCoreSignupReferralStepPlanSelectionTotal>(
            { name: 'web_core_signup_referralStep_planSelection_total', version: 2 },
            this.requestService
        );
        this.core_signup_backButton_total = new Counter<WebCoreSignupBackButtonTotal>(
            { name: 'web_core_signup_backButton_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_pageLoad_2_total = new Counter<WebCoreVpnSingleSignupPageLoad2Total>(
            { name: 'web_core_vpn_single_signup_pageLoad_2_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_fetchDependencies_2_total =
            new Counter<WebCoreVpnSingleSignupFetchDependencies2Total>(
                { name: 'web_core_vpn_single_signup_fetchDependencies_2_total', version: 1 },
                this.requestService
            );
        this.core_vpn_single_signup_step1_interaction_2_total =
            new Counter<WebCoreVpnSingleSignupStep1Interaction2Total>(
                { name: 'web_core_vpn_single_signup_step1_interaction_2_total', version: 1 },
                this.requestService
            );
        this.core_vpn_single_signup_step1_currencyChange_2_total =
            new Counter<WebCoreVpnSingleSignupStep1CurrencyChange2Total>(
                { name: 'web_core_vpn_single_signup_step1_currencyChange_2_total', version: 1 },
                this.requestService
            );
        this.core_vpn_single_signup_step1_cycleChange_2_total =
            new Counter<WebCoreVpnSingleSignupStep1CycleChange2Total>(
                { name: 'web_core_vpn_single_signup_step1_cycleChange_2_total', version: 1 },
                this.requestService
            );
        this.core_vpn_single_signup_step1_payment_2_total = new Counter<WebCoreVpnSingleSignupStep1Payment2Total>(
            { name: 'web_core_vpn_single_signup_step1_payment_2_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_step1_accountCreation_2_total =
            new Counter<WebCoreVpnSingleSignupStep1AccountCreation2Total>(
                { name: 'web_core_vpn_single_signup_step1_accountCreation_2_total', version: 1 },
                this.requestService
            );
        this.core_vpn_single_signup_step2_setup_3_total = new Counter<WebCoreVpnSingleSignupStep2Setup3Total>(
            { name: 'web_core_vpn_single_signup_step2_setup_3_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_passwordSelection_step_2_total =
            new Counter<WebCoreVpnSingleSignupPasswordSelectionStep2Total>(
                { name: 'web_core_vpn_single_signup_passwordSelection_step_2_total', version: 1 },
                this.requestService
            );
        this.core_vpn_single_signup_step3_complete_2_total = new Counter<WebCoreVpnSingleSignupStep3Complete2Total>(
            { name: 'web_core_vpn_single_signup_step3_complete_2_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_step4_setup_2_total = new Counter<WebCoreVpnSingleSignupStep4Setup2Total>(
            { name: 'web_core_vpn_single_signup_step4_setup_2_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_step4_orgSetup_total = new Counter<WebCoreVpnSingleSignupStep4OrgSetupTotal>(
            { name: 'web_core_vpn_single_signup_step4_orgSetup_total', version: 1 },
            this.requestService
        );
        this.payments_subscription_steps_total = new Counter<WebPaymentsSubscriptionStepsTotal>(
            { name: 'web_payments_subscription_steps_total', version: 1 },
            this.requestService
        );
        this.payments_subscription_total = new Counter<WebPaymentsSubscriptionTotal>(
            { name: 'web_payments_subscription_total', version: 1 },
            this.requestService
        );
        this.core_session_recovery_initiation_modal_load_total =
            new Counter<WebCoreSessionRecoveryInitiationModalLoadTotal>(
                { name: 'web_core_session_recovery_initiation_modal_load_total', version: 1 },
                this.requestService
            );
        this.core_session_recovery_initiation_total = new Counter<WebCoreSessionRecoveryInitiationTotal>(
            { name: 'web_core_session_recovery_initiation_total', version: 1 },
            this.requestService
        );
        this.core_session_recovery_abort_total = new Counter<WebCoreSessionRecoveryAbortTotal>(
            { name: 'web_core_session_recovery_abort_total', version: 1 },
            this.requestService
        );
        this.core_session_recovery_cancellation_modal_load_total =
            new Counter<WebCoreSessionRecoveryCancellationModalLoadTotal>(
                { name: 'web_core_session_recovery_cancellation_modal_load_total', version: 1 },
                this.requestService
            );
        this.core_session_recovery_consume_total = new Counter<WebCoreSessionRecoveryConsumeTotal>(
            { name: 'web_core_session_recovery_consume_total', version: 1 },
            this.requestService
        );
        this.core_session_recovery_password_reset_available_account_modal_load_total =
            new Counter<WebCoreSessionRecoveryPasswordResetAvailableAccountModalLoadTotal>(
                { name: 'web_core_session_recovery_password_reset_available_account_modal_load_total', version: 1 },
                this.requestService
            );
        this.core_session_recovery_settings_update_total = new Counter<WebCoreSessionRecoverySettingsUpdateTotal>(
            { name: 'web_core_session_recovery_settings_update_total', version: 1 },
            this.requestService
        );
        this.crypto_keytransparency_errors_total = new Counter<WebCryptoKeyTransparencyErrorsTotal>(
            { name: 'web_crypto_keytransparency_errors_total', version: 1 },
            this.requestService
        );
    }
}

const metricsApi = new MetricsApi();
const metricsRequestService = new MetricsRequestService(metricsApi, {
    reportMetrics: true,
    batch: {
        frequency: METRICS_REQUEST_FREQUENCY_SECONDS * SECOND,
        size: METRICS_BATCH_SIZE,
    },
});
const metrics = new Metrics(metricsRequestService);

export default metrics;
