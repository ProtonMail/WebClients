import { c } from 'ttag';

import { PROTON_SENTINEL_NAME, WALLET_APP_NAME } from '@proton/shared/lib/constants';

import { SecurityChecklistItem } from './SecurityChecklistItem';
import { useSecurityChecklist } from './useSecurityChecklist';

const Separator = () => <hr aria-hidden="true" className="bg-norm mb-0" style={{ height: '2px' }} />;

export const SecurityChecklist = () => {
    const { shouldActivate2FA, shouldGetProtonSentinel, shouldSetRecovery, loadingRecovery } = useSecurityChecklist();

    return (
        <div>
            <h3 className="text-rg color-weak ml-2">{c('Wallet Sidebar').t`Your ${WALLET_APP_NAME} checklist`}</h3>

            <ul className="rounded-lg overflow-hidden unstyled my-2">
                <li>
                    <SecurityChecklistItem
                        loading={loadingRecovery}
                        done={!shouldSetRecovery}
                        label={c('Wallet Sidebar').t`Recovery Setup`}
                        path="/recovery"
                    />
                </li>
                <Separator />
                <li>
                    <SecurityChecklistItem
                        done={!shouldActivate2FA}
                        label={c('Wallet Sidebar').t`Active 2FA`}
                        path="/account-password#two-fa"
                    />
                </li>
                <Separator />
                <li>
                    <SecurityChecklistItem
                        done={!shouldGetProtonSentinel}
                        label={c('Wallet Sidebar').t`Get ${PROTON_SENTINEL_NAME}`}
                        path="/security#sentinel"
                    />
                </li>
            </ul>
        </div>
    );
};
