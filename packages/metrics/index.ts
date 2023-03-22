import { SECOND } from '@proton/shared/lib/constants';

import { METRICS_BATCH_SIZE, METRICS_REQUEST_FREQUENCY_SECONDS } from './constants';
import Counter from './lib/Counter';
import MetricsApi from './lib/MetricsApi';
import MetricsBase from './lib/MetricsBase';
import MetricsRequestService from './lib/MetricsRequestService';
import IMetricsRequestService from './lib/types/IMetricsRequestService';
import { WebCoreSignupAccountStepAccountCreationTotal } from './types/web_core_signup_accountStep_accountCreation_total_v1.schema.d';
import { WebCoreSignupBackButtonTotal } from './types/web_core_signup_backButton_total_v1.schema.d';
import { WebCoreSignupCongratulationsStepDisplayNameChoiceTotal } from './types/web_core_signup_congratulationsStep_displayNameChoice_total_v1.schema.d';
import { WebCoreSignupExploreStepLoginTotal } from './types/web_core_signup_exploreStep_login_total_v1.schema.d';
import { WebCoreSignupLoadingStepAccountSetupTotal } from './types/web_core_signup_loadingStep_accountSetup_total_v1.schema.d';
import { WebCoreSignupPageLoadTotal } from './types/web_core_signup_pageLoad_total_v1.schema.d';
import { WebCoreSignupPaymentStepPaymentTotal } from './types/web_core_signup_paymentStep_payment_total_v1.schema.d';
import { WebCoreSignupRecoveryStepSetRecoveryMethodTotal } from './types/web_core_signup_recoveryStep_setRecoveryMethod_total_v1.schema.d';
import { WebCoreSignupReferralStepPlanSelectionTotal } from './types/web_core_signup_referralStep_planSelection_total_v1.schema.d';
import { WebCoreSignupUpsellStepPlanSelectionTotal } from './types/web_core_signup_upsellStep_planSelection_total_v1.schema.d';
import { WebCoreSignupVerificationStepVerificationTotal } from './types/web_core_signup_verificationStep_verification_total_v1.schema.d';

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

    constructor(requestService: IMetricsRequestService) {
        super(requestService);

        this.core_signup_pageLoad_total = new Counter<WebCoreSignupPageLoadTotal>(
            { name: 'web_core_signup_pageLoad_total', version: 1 },
            this.requestService
        );
        this.core_signup_accountStep_accountCreation_total = new Counter<WebCoreSignupAccountStepAccountCreationTotal>(
            { name: 'web_core_signup_accountStep_accountCreation_total', version: 1 },
            this.requestService
        );
        this.core_signup_verificationStep_verification_total =
            new Counter<WebCoreSignupVerificationStepVerificationTotal>(
                { name: 'web_core_signup_verificationStep_verification_total', version: 1 },
                this.requestService
            );
        this.core_signup_upsellStep_planSelection_total = new Counter<WebCoreSignupUpsellStepPlanSelectionTotal>(
            { name: 'web_core_signup_upsellStep_planSelection_total', version: 1 },
            this.requestService
        );
        this.core_signup_paymentStep_payment_total = new Counter<WebCoreSignupPaymentStepPaymentTotal>(
            { name: 'web_core_signup_paymentStep_payment_total', version: 1 },
            this.requestService
        );
        this.core_signup_loadingStep_accountSetup_total = new Counter<WebCoreSignupLoadingStepAccountSetupTotal>(
            { name: 'web_core_signup_loadingStep_accountSetup_total', version: 1 },
            this.requestService
        );
        this.core_signup_congratulationsStep_displayNameChoice_total =
            new Counter<WebCoreSignupCongratulationsStepDisplayNameChoiceTotal>(
                { name: 'web_core_signup_congratulationsStep_displayNameChoice_total', version: 1 },
                this.requestService
            );
        this.core_signup_exploreStep_login_total = new Counter<WebCoreSignupExploreStepLoginTotal>(
            { name: 'web_core_signup_exploreStep_login_total', version: 1 },
            this.requestService
        );
        this.core_signup_recoveryStep_setRecoveryMethod_total =
            new Counter<WebCoreSignupRecoveryStepSetRecoveryMethodTotal>(
                { name: 'web_core_signup_recoveryStep_setRecoveryMethod_total', version: 1 },
                this.requestService
            );
        this.core_signup_referralStep_planSelection_total = new Counter<WebCoreSignupReferralStepPlanSelectionTotal>(
            { name: 'web_core_signup_referralStep_planSelection_total', version: 1 },
            this.requestService
        );
        this.core_signup_backButton_total = new Counter<WebCoreSignupBackButtonTotal>(
            { name: 'web_core_signup_backButton_total', version: 1 },
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
