import { SECOND } from '@proton/shared/lib/constants';

import { METRICS_BATCH_SIZE, METRICS_REQUEST_FREQUENCY_SECONDS } from './constants';
import Counter from './lib/Counter';
import MetricsApi from './lib/MetricsApi';
import MetricsBase from './lib/MetricsBase';
import MetricsRequestService from './lib/MetricsRequestService';
import IMetricsRequestService from './lib/types/IMetricsRequestService';
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
import { WebCoreVpnSingleSignupFetchDependenciesTotal } from './types/web_core_vpn_single_signup_fetchDependencies_total_v1.schema';
import { WebCoreVpnSingleSignupPageLoadTotal } from './types/web_core_vpn_single_signup_pageLoad_total_v1.schema';
import { WebCoreVpnSingleSignupPasswordSelectionStepTotal } from './types/web_core_vpn_single_signup_passwordSelection_step_total_v1.schema';
import { WebCoreVpnSingleSignupStep1AccountCreationTotal } from './types/web_core_vpn_single_signup_step1_accountCreation_total_v1.schema';
import { WebCoreVpnSingleSignupStep1CurrencyChangeTotal } from './types/web_core_vpn_single_signup_step1_currencyChange_total_v1.schema';
import { WebCoreVpnSingleSignupStep1CycleChangeTotal } from './types/web_core_vpn_single_signup_step1_cycleChange_total_v1.schema';
import { WebCoreVpnSingleSignupStep1InteractionTotal } from './types/web_core_vpn_single_signup_step1_interaction_total_v1.schema';
import { WebCoreVpnSingleSignupStep1PaymentTotal } from './types/web_core_vpn_single_signup_step1_payment_total_v1.schema';
import { WebCoreVpnSingleSignupStep2Setup2Total } from './types/web_core_vpn_single_signup_step2_setup_2_total_v1.schema';
import { WebCoreVpnSingleSignupStep3CompleteTotal } from './types/web_core_vpn_single_signup_step3_complete_total_v1.schema';
import { WebCoreVpnSingleSignupStep4SetupTotal } from './types/web_core_vpn_single_signup_step4_setup_total_v1.schema';

export { default as observeApiError } from './lib/observeApiError';
export * from './lib/observeApiError';

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

    public core_vpn_single_signup_pageLoad_total: Counter<WebCoreVpnSingleSignupPageLoadTotal>;

    public core_vpn_single_signup_fetchDependencies_total: Counter<WebCoreVpnSingleSignupFetchDependenciesTotal>;

    public core_vpn_single_signup_step1_accountCreation_total: Counter<WebCoreVpnSingleSignupStep1AccountCreationTotal>;

    public core_vpn_single_signup_step1_interaction_total: Counter<WebCoreVpnSingleSignupStep1InteractionTotal>;

    public core_vpn_single_signup_step1_currencyChange_total: Counter<WebCoreVpnSingleSignupStep1CurrencyChangeTotal>;

    public core_vpn_single_signup_step1_cycleChange_total: Counter<WebCoreVpnSingleSignupStep1CycleChangeTotal>;

    public core_vpn_single_signup_step1_payment_total: Counter<WebCoreVpnSingleSignupStep1PaymentTotal>;

    public core_vpn_single_signup_step2_setup_2_total: Counter<WebCoreVpnSingleSignupStep2Setup2Total>;

    public core_vpn_single_signup_passwordSelection_step_total: Counter<WebCoreVpnSingleSignupPasswordSelectionStepTotal>;

    public core_vpn_single_signup_step3_complete_total: Counter<WebCoreVpnSingleSignupStep3CompleteTotal>;

    public core_vpn_single_signup_step4_setup_total: Counter<WebCoreVpnSingleSignupStep4SetupTotal>;

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
        this.core_vpn_single_signup_pageLoad_total = new Counter<WebCoreVpnSingleSignupPageLoadTotal>(
            { name: 'web_core_vpn_single_signup_pageLoad_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_fetchDependencies_total = new Counter<WebCoreVpnSingleSignupFetchDependenciesTotal>(
            { name: 'web_core_vpn_single_signup_fetchDependencies_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_step1_interaction_total = new Counter<WebCoreVpnSingleSignupStep1InteractionTotal>(
            { name: 'web_core_vpn_single_signup_step1_interaction_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_step1_currencyChange_total =
            new Counter<WebCoreVpnSingleSignupStep1CurrencyChangeTotal>(
                { name: 'web_core_vpn_single_signup_step1_currencyChange_total', version: 1 },
                this.requestService
            );
        this.core_vpn_single_signup_step1_cycleChange_total = new Counter<WebCoreVpnSingleSignupStep1CycleChangeTotal>(
            { name: 'web_core_vpn_single_signup_step1_cycleChange_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_step1_payment_total = new Counter<WebCoreVpnSingleSignupStep1PaymentTotal>(
            { name: 'web_core_vpn_single_signup_step1_payment_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_step1_accountCreation_total =
            new Counter<WebCoreVpnSingleSignupStep1AccountCreationTotal>(
                { name: 'web_core_vpn_single_signup_step1_accountCreation_total', version: 1 },
                this.requestService
            );
        this.core_vpn_single_signup_step2_setup_2_total = new Counter<WebCoreVpnSingleSignupStep2Setup2Total>(
            { name: 'web_core_vpn_single_signup_step2_setup_2_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_passwordSelection_step_total =
            new Counter<WebCoreVpnSingleSignupPasswordSelectionStepTotal>(
                { name: 'web_core_vpn_single_signup_passwordSelection_step_total', version: 1 },
                this.requestService
            );
        this.core_vpn_single_signup_step3_complete_total = new Counter<WebCoreVpnSingleSignupStep3CompleteTotal>(
            { name: 'web_core_vpn_single_signup_step3_complete_total', version: 1 },
            this.requestService
        );
        this.core_vpn_single_signup_step4_setup_total = new Counter<WebCoreVpnSingleSignupStep4SetupTotal>(
            { name: 'web_core_vpn_single_signup_step4_setup_total', version: 1 },
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
