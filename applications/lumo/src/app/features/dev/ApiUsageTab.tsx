import { c } from 'ttag';

import {
    setDebugApiAccessDenied,
    setDebugApiCreditBalance,
    setDebugApiEmptyUsage,
    setDebugApiOrganizationMemberView,
    setDebugApiOrganizationView,
    useDebugApiAccessDenied,
    useDebugApiCreditBalance,
    useDebugApiEmptyUsage,
    useDebugApiOrganizationMemberView,
    useDebugApiOrganizationView,
} from '../../services/apiUsageDebugStore';

export const ApiUsageTab = () => {
    const organizationViewEnabled = useDebugApiOrganizationView();
    const organizationMemberViewEnabled = useDebugApiOrganizationMemberView();
    const creditBalanceOverride = useDebugApiCreditBalance();
    const emptyUsageEnabled = useDebugApiEmptyUsage();
    const apiAccessDeniedEnabled = useDebugApiAccessDenied();

    return (
        <div className="debug-view-tab-panel">
            <div className="debug-view-header">
                <span className="debug-view-header-icon">🧾</span>
                {c('lumo: Debug View').t`API usage and balance`}
            </div>

            <div className="debug-view-row">
                <span className="debug-view-label">{c('lumo: Debug View').t`Dashboard view`}</span>
                <span className="debug-view-value">
                    {organizationViewEnabled
                        ? c('lumo: Debug View').t`Organization admin`
                        : organizationMemberViewEnabled
                          ? c('lumo: Debug View').t`Organization member`
                          : c('lumo: Debug View').t`Personal`}
                </span>
            </div>
            <div className="debug-view-actions">
                <button
                    type="button"
                    className={`debug-view-btn ${
                        !organizationViewEnabled && !organizationMemberViewEnabled
                            ? 'debug-view-btn--primary'
                            : 'debug-view-btn--secondary'
                    }`}
                    onClick={() => {
                        setDebugApiOrganizationView(false);
                        setDebugApiOrganizationMemberView(false);
                    }}
                >
                    {c('lumo: Debug View').t`Personal`}
                </button>
                <button
                    type="button"
                    className={`debug-view-btn ${
                        organizationViewEnabled ? 'debug-view-btn--primary' : 'debug-view-btn--secondary'
                    }`}
                    aria-pressed={organizationViewEnabled}
                    onClick={() => setDebugApiOrganizationView(true)}
                >
                    {c('lumo: Debug View').t`Org admin`}
                </button>
                <button
                    type="button"
                    className={`debug-view-btn ${
                        organizationMemberViewEnabled ? 'debug-view-btn--primary' : 'debug-view-btn--secondary'
                    }`}
                    aria-pressed={organizationMemberViewEnabled}
                    onClick={() => setDebugApiOrganizationMemberView(true)}
                >
                    {c('lumo: Debug View').t`Org member`}
                </button>
            </div>

            <div className="debug-view-section">
                <div className="debug-view-row">
                    <span className="debug-view-label">{c('lumo: Debug View').t`API access`}</span>
                    <span className="debug-view-value">
                        {apiAccessDeniedEnabled
                            ? c('lumo: Debug View').t`Not allowed`
                            : c('lumo: Debug View').t`Allowed`}
                    </span>
                </div>
                <button
                    type="button"
                    className={`debug-view-btn ${
                        apiAccessDeniedEnabled ? 'debug-view-btn--primary' : 'debug-view-btn--secondary'
                    }`}
                    aria-pressed={apiAccessDeniedEnabled}
                    onClick={() => setDebugApiAccessDenied(!apiAccessDeniedEnabled)}
                >
                    {apiAccessDeniedEnabled
                        ? c('lumo: Debug View').t`Allow API access`
                        : c('lumo: Debug View').t`Preview access denied`}
                </button>
            </div>

            <div className="debug-view-section">
                <div className="debug-view-row">
                    <span className="debug-view-label">{c('lumo: Debug View').t`Usage data`}</span>
                    <span className="debug-view-value">
                        {emptyUsageEnabled ? c('lumo: Debug View').t`Empty` : c('lumo: Debug View').t`Sample data`}
                    </span>
                </div>
                <button
                    type="button"
                    className={`debug-view-btn ${
                        emptyUsageEnabled ? 'debug-view-btn--primary' : 'debug-view-btn--secondary'
                    }`}
                    aria-pressed={emptyUsageEnabled}
                    onClick={() => setDebugApiEmptyUsage(!emptyUsageEnabled)}
                >
                    {emptyUsageEnabled
                        ? c('lumo: Debug View').t`Show sample usage`
                        : c('lumo: Debug View').t`Preview empty usage`}
                </button>
            </div>

            <div className="debug-view-section">
                <div className="debug-view-row">
                    <span className="debug-view-label">{c('lumo: Debug View').t`API balance`}</span>
                    <span className="debug-view-value">
                        {creditBalanceOverride === null
                            ? c('lumo: Debug View').t`Real balance`
                            : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
                                  creditBalanceOverride
                              )}
                    </span>
                </div>
                <div className="debug-view-actions">
                    <button
                        type="button"
                        className="debug-view-btn debug-view-btn--secondary"
                        onClick={() => setDebugApiCreditBalance(0)}
                    >
                        ⏸ {c('lumo: Debug View').t`Empty balance`}
                    </button>
                    <button
                        type="button"
                        className="debug-view-btn debug-view-btn--secondary"
                        onClick={() => setDebugApiCreditBalance(5)}
                    >
                        ⚠️ {c('lumo: Debug View').t`Low balance ($5)`}
                    </button>
                    <button
                        type="button"
                        className="debug-view-btn debug-view-btn--primary"
                        onClick={() => setDebugApiCreditBalance((creditBalanceOverride ?? 0) + 50)}
                    >
                        💳 {c('lumo: Debug View').t`Simulate $50 purchase`}
                    </button>
                    <button
                        type="button"
                        className="debug-view-btn debug-view-btn--secondary"
                        onClick={() => setDebugApiCreditBalance(null)}
                    >
                        ↺ {c('lumo: Debug View').t`Use real balance`}
                    </button>
                </div>
            </div>

            <div className="debug-view-hint" style={{ marginTop: '10px' }}>
                {c('lumo: Debug View')
                    .t`Open API usage to preview empty, low, and funded balance states. Overrides only affect the PoC UI.`}
            </div>
        </div>
    );
};
