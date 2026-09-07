import { c } from 'ttag';

import {
    selectAccountSecurityElements,
    selectAccountSecurityIssuesCount,
    selectHasAccountSecurityCardToDisplay,
    selectHasSentinelOrTFACardToDisplay,
} from '@proton/account';
import { useApi } from '@proton/app-context/useApi';
import { FeatureCode, useFeature } from '@proton/features';
import { IcMobile } from '@proton/icons/icons/IcMobile';
import { IcSpeechBubble } from '@proton/icons/icons/IcSpeechBubble';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { IcUser } from '@proton/icons/icons/IcUser';
import { baseUseSelector } from '@proton/react-redux-store';
import { TelemetrySecurityCenterEvents } from '@proton/shared/lib/api/telemetry';
import { useFlag } from '@proton/unleash/useFlag';

import { sendSecurityCenterReport } from '../securityCenterTelemetry';
import AccountSecurityCard from './AccountSecurityCard';
import AccountSecuritySuccess from './AccountSecuritySuccess';

const AccountSecurity = () => {
    const api = useApi();
    const {
        accountRecoverySet,
        dataRecoverySet,
        twoFactorAuthSetOrDismissed,
        twoFactorAuthSet,
        hasSentinelEnabled,
        recoveryPhraseSet,
    } = baseUseSelector(selectAccountSecurityElements);
    const hasCardsToDisplay = baseUseSelector(selectHasAccountSecurityCardToDisplay);
    const hasSentinelOrTFACardToDisplay = baseUseSelector(selectHasSentinelOrTFACardToDisplay);
    const dismissed2FACardFeature = useFeature(FeatureCode.AccountSecurityDismissed2FACard);
    const canDisplayBreachNotifications = useFlag('BreachAlertsNotificationsCommon');
    const accountIssuesCountNonDissmissable = baseUseSelector(selectAccountSecurityIssuesCount);

    const getCount = () => {
        if (hasSentinelEnabled && !recoveryPhraseSet) {
            return ' (1)';
        }
        return accountIssuesCountNonDissmissable ? ` (${accountIssuesCountNonDissmissable})` : '';
    };

    return (
        <div className="w-full">
            <h3 className="text-rg text-bold mt-1 mb-2">
                {c('Title').t`Account security`}
                {canDisplayBreachNotifications && <>{getCount()}</>}
            </h3>

            {(() => {
                if (hasSentinelEnabled) {
                    if (hasSentinelOrTFACardToDisplay) {
                        return (
                            <div className="flex flex-column flex-nowrap gap-2 w-full">
                                {!recoveryPhraseSet && (
                                    <AccountSecurityCard
                                        title={c('Title').t`Set recovery phrase`}
                                        description={c('Description')
                                            .t`To ensure highest possible security of your account, set a recovery phrase.`}
                                        critical
                                        isDanger
                                        icon={IcSpeechBubble}
                                        path="/recovery#account"
                                    />
                                )}
                                {!twoFactorAuthSetOrDismissed && (
                                    <AccountSecurityCard
                                        title={c('Title').t`Enable 2FA`}
                                        description={c('Description')
                                            .t`2FA adds an extra security layer, preventing unauthorized access.`}
                                        icon={IcMobile}
                                        path="/account-password#two-fa"
                                        isDismissible
                                        onClick={() => {
                                            void sendSecurityCenterReport(api, {
                                                event: TelemetrySecurityCenterEvents.account_security_card,
                                                dimensions: {
                                                    card_action: 'clicked',
                                                    card: 'two_factor_authentication',
                                                },
                                            });
                                        }}
                                        onDismiss={() => {
                                            void dismissed2FACardFeature.update(true);
                                            void sendSecurityCenterReport(api, {
                                                event: TelemetrySecurityCenterEvents.account_security_card,
                                                dimensions: {
                                                    card_action: 'dismissed',
                                                    card: 'two_factor_authentication',
                                                },
                                            });
                                        }}
                                    />
                                )}
                            </div>
                        );
                    }
                    return <AccountSecuritySuccess twoFactorAuthSet={twoFactorAuthSet} />;
                }
                return (
                    <>
                        {!hasCardsToDisplay ? (
                            <AccountSecuritySuccess twoFactorAuthSet={twoFactorAuthSet} />
                        ) : (
                            <div className="flex flex-column flex-nowrap gap-2 w-full">
                                {!accountRecoverySet && (
                                    <AccountSecurityCard
                                        title={c('Title').t`Account recovery`}
                                        description={c('Description')
                                            .t`Set a recovery method to prevent losing access to your account.`}
                                        critical
                                        icon={IcUser}
                                        path="/recovery#account"
                                        onClick={() => {
                                            void sendSecurityCenterReport(api, {
                                                event: TelemetrySecurityCenterEvents.account_security_card,
                                                dimensions: { card_action: 'clicked', card: 'account_recovery' },
                                            });
                                        }}
                                    />
                                )}
                                {!dataRecoverySet && (
                                    <AccountSecurityCard
                                        title={c('Title').t`Data recovery`}
                                        description={c('Description')
                                            .t`Set a data recovery method to prevent data loss.`}
                                        critical
                                        icon={IcStorage}
                                        path="/recovery#data"
                                        onClick={() => {
                                            void sendSecurityCenterReport(api, {
                                                event: TelemetrySecurityCenterEvents.account_security_card,
                                                dimensions: { card_action: 'clicked', card: 'data_recovery' },
                                            });
                                        }}
                                    />
                                )}
                                {!twoFactorAuthSetOrDismissed && (
                                    <AccountSecurityCard
                                        title={c('Title').t`Enable 2FA`}
                                        description={c('Description')
                                            .t`2FA adds an extra security layer, preventing unauthorized access.`}
                                        icon={IcMobile}
                                        path="/account-password#two-fa"
                                        isDismissible
                                        onClick={() => {
                                            void sendSecurityCenterReport(api, {
                                                event: TelemetrySecurityCenterEvents.account_security_card,
                                                dimensions: {
                                                    card_action: 'clicked',
                                                    card: 'two_factor_authentication',
                                                },
                                            });
                                        }}
                                        onDismiss={() => {
                                            void dismissed2FACardFeature.update(true);
                                            void sendSecurityCenterReport(api, {
                                                event: TelemetrySecurityCenterEvents.account_security_card,
                                                dimensions: {
                                                    card_action: 'dismissed',
                                                    card: 'two_factor_authentication',
                                                },
                                            });
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </>
                );
            })()}
        </div>
    );
};

export default AccountSecurity;
