import React from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/components/hooks';
import { FeatureCode, useFeature } from '@proton/features';
import { baseUseSelector } from '@proton/redux-shared-store/sharedContext';
import { TelemetrySecurityCenterEvents } from '@proton/shared/lib/api/telemetry';

import { sendSecurityCenterReport } from '../securityCenterTelemetry';
import AccountSecurityCard from './AccountSecurityCard';
import AccountSecuritySuccess from './AccountSecuritySuccess';
import { selectAccountSecurityElements, selectHasAccountSecurityCardToDisplay } from './slice/accountSecuritySlice';

const AccountSecurity = () => {
    const api = useApi();
    const { accountRecoverySet, dataRecoverySet, twoFactorAuthSetOrDismissed, twoFactorAuthSet } =
        baseUseSelector(selectAccountSecurityElements);
    const hasCardsToDisplay = baseUseSelector(selectHasAccountSecurityCardToDisplay);
    const dismissed2FACardFeature = useFeature(FeatureCode.AccountSecurityDismissed2FACard);

    return (
        <div className="w-full">
            <h3 className="text-rg text-bold mt-1 mb-2">{c('Title').t`Account security`}</h3>

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
                            icon="user"
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
                            description={c('Description').t`Set a data recovery method to prevent data loss.`}
                            critical
                            icon="storage"
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
                            icon="mobile"
                            path="/account-password#two-fa"
                            isDismissible
                            onClick={() => {
                                void sendSecurityCenterReport(api, {
                                    event: TelemetrySecurityCenterEvents.account_security_card,
                                    dimensions: { card_action: 'clicked', card: 'two_factor_authentication' },
                                });
                            }}
                            onDismiss={() => {
                                void dismissed2FACardFeature.update(true);
                                void sendSecurityCenterReport(api, {
                                    event: TelemetrySecurityCenterEvents.account_security_card,
                                    dimensions: { card_action: 'dismissed', card: 'two_factor_authentication' },
                                });
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default AccountSecurity;
