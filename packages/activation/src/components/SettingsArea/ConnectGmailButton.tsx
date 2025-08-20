import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import GmailSyncModal from '@proton/activation/src/components/Modals/GmailSyncModal/GmailSyncModal';
import ReachedLimitForwardingModal from '@proton/activation/src/components/Modals/ReachedLimitForwardingModal/ReachedLimitForwardingModal';
import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '@proton/activation/src/constants';
import useSetupGmailBYOEAddress from '@proton/activation/src/hooks/useSetupGmailBYOEAddress';
import { EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms';
import { UpsellModal, useModalState } from '@proton/components';
import useConfig from '@proton/components/hooks/useConfig';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { type APP_NAMES, MAIL_APP_NAME, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { isFree, isPaid } from '@proton/shared/lib/user/helpers';
import forwardImg from '@proton/styles/assets/img/illustrations/new-upsells-img/easy-switch-forward.svg';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

interface Props {
    app?: APP_NAMES;
    showIcon?: boolean;
    className?: string;
    buttonText?: string;
}

const ConnectGmailButton = ({
    app,
    showIcon,
    className,
    buttonText = c('Action').t`Set up auto-forwarding from Gmail`,
}: Props) => {
    const [user, loadingUser] = useUser();
    const { APP_NAME } = useConfig();

    const { hasAccessToBYOE, isInMaintenance, handleSyncCallback, allSyncs } = useSetupGmailBYOEAddress();

    const [syncModalProps, setSyncModalProps, renderSyncModal] = useModalState();
    const [reachedLimitForwardingModalProps, setReachedLimitForwardingModalProps, renderReachedLimitForwardingModal] =
        useModalState();
    const [upsellForwardingModalProps, setUpsellForwardingModalProps, renderUpsellForwardingModal] = useModalState();

    const planName = PLAN_NAMES[PLANS.MAIL];
    const upsellRef =
        getUpsellRefFromApp({
            app: APP_NAME,
            feature: SHARED_UPSELL_PATHS.EASY_SWITCH_BYOE,
            component: UPSELL_COMPONENT.MODAL,
            fromApp: app,
        }) || '';

    const disabled = loadingUser || !user.hasNonDelinquentScope || isInMaintenance;

    const handleCloseForwardingModal = (hasError?: boolean) => {
        if (!hasError) {
            setSyncModalProps(false);
        }
    };

    const handleAddForwarding = () => {
        if (isFree(user) && allSyncs.length >= MAX_SYNC_FREE_USER) {
            setUpsellForwardingModalProps(true);
        } else if (isPaid(user) && allSyncs.length >= MAX_SYNC_PAID_USER) {
            setReachedLimitForwardingModalProps(true);
        } else {
            setSyncModalProps(true);
        }
    };

    return (
        <>
            <Button
                className={className}
                onClick={handleAddForwarding}
                disabled={disabled}
                data-testid="ProviderButton:googleCardForward"
            >
                {showIcon && <img src={googleLogo} alt="" />}
                {buttonText}
            </Button>

            {renderSyncModal && (
                <GmailSyncModal
                    noSkip
                    onSyncCallback={hasAccessToBYOE ? handleSyncCallback : handleCloseForwardingModal}
                    source={
                        hasAccessToBYOE
                            ? EASY_SWITCH_SOURCES.ACCOUNT_WEB_EXTERNAL_GMAIL
                            : EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS
                    }
                    hasAccessToBYOE={hasAccessToBYOE}
                    {...syncModalProps}
                />
            )}

            {renderReachedLimitForwardingModal && <ReachedLimitForwardingModal {...reachedLimitForwardingModalProps} />}
            {renderUpsellForwardingModal && (
                <UpsellModal
                    upsellRef={upsellRef}
                    title={
                        hasAccessToBYOE
                            ? c('Title').t`Connect more addresses`
                            : c('Title').t`Multiple accounts, 1 private inbox`
                    }
                    description={
                        <>
                            <span>
                                {hasAccessToBYOE
                                    ? /*translator: full sentence is "You've connected 1 Gmail address to Proton Mail."*/
                                      c('loc_nightly: BYOE').ngettext(
                                          msgid`You've connected ${MAX_SYNC_FREE_USER} Gmail address to ${MAIL_APP_NAME}.`,
                                          `You've connected ${MAX_SYNC_FREE_USER} Gmail addresses to ${MAIL_APP_NAME}.`,
                                          MAX_SYNC_FREE_USER
                                      )
                                    : /*translator: full sentence is "You're forwarding emails from 1 external account to Proton Mail."*/
                                      c('Easy switch').ngettext(
                                          msgid`You're forwarding emails from ${MAX_SYNC_FREE_USER} external account to ${MAIL_APP_NAME}.`,
                                          `You're forwarding emails from ${MAX_SYNC_FREE_USER} external accounts to ${MAIL_APP_NAME}.`,
                                          MAX_SYNC_FREE_USER
                                      )}
                            </span>
                            <span className="ml-1">
                                {hasAccessToBYOE
                                    ? /*translator: full sentence is "To connect more, upgrade to Mail Plus and get up to 3 Gmail accounts linked to your inbox."*/
                                      c('loc_nightly: BYOE').ngettext(
                                          msgid`To connect up to ${MAX_SYNC_PAID_USER} Gmail address, upgrade to ${planName}.`,
                                          `To connect up to ${MAX_SYNC_PAID_USER} Gmail addresses, upgrade to ${planName}.`,
                                          MAX_SYNC_PAID_USER
                                      )
                                    : /*translator: full sentence is "To forward emails from up to 3 accounts, upgrade to Mail Plus."*/
                                      c('Easy switch').ngettext(
                                          msgid`To forward emails from up to ${MAX_SYNC_PAID_USER} account, upgrade to ${planName}.`,
                                          `To forward emails from up to ${MAX_SYNC_PAID_USER} accounts, upgrade to ${planName}.`,
                                          MAX_SYNC_PAID_USER
                                      )}
                            </span>
                        </>
                    }
                    modalProps={upsellForwardingModalProps}
                    illustration={forwardImg}
                />
            )}
        </>
    );
};

export default ConnectGmailButton;
