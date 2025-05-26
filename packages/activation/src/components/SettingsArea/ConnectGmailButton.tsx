import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import GmailSyncModal from '@proton/activation/src/components/Modals/GmailSyncModal/GmailSyncModal';
import ReachedLimitForwardingModal from '@proton/activation/src/components/Modals/ReachedLimitForwardingModal/ReachedLimitForwardingModal';
import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '@proton/activation/src/constants';
import useSetupGmailBYOEAddress from '@proton/activation/src/hooks/useSetupGmailBYOEAddress';
import { EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms';
import useConfig from '@proton/components/hooks/useConfig';
import { UpsellModal, useModalState } from '@proton/components/index';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { type APP_NAMES, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
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

    const { hasAccessToBYOE, isInMaintenance, googleOAuthScope, handleSyncCallback, allSyncs } =
        useSetupGmailBYOEAddress();

    const [syncModalProps, setSyncModalProps, renderSyncModal] = useModalState();
    const [reachedLimitForwardingModalProps, setReachedLimitForwardingModalProps, renderReachedLimitForwardingModal] =
        useModalState();
    const [upsellForwardingModalProps, setUpsellForwardingModalProps, renderUpsellForwardingModal] = useModalState();

    const planName = PLAN_NAMES[PLANS.MAIL];
    const upsellRef =
        getUpsellRefFromApp({
            app: APP_NAME,
            feature: SHARED_UPSELL_PATHS.EASY_SWITCH_FORWARDING,
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
        /* TODO to change later
         * For the first phase, we don't want to show the upsell modal to users not having access to BYOE.
         * We want to show them the limit modal if they reach the current limit that is on production though
         */
        const showUpsellModal = hasAccessToBYOE && isFree(user) && allSyncs.length >= MAX_SYNC_FREE_USER;
        const showLimitModal =
            (isPaid(user) && allSyncs.length >= MAX_SYNC_PAID_USER) ||
            (isFree(user) && allSyncs.length >= MAX_SYNC_PAID_USER);
        if (showUpsellModal) {
            setUpsellForwardingModalProps(true);
        } else if (showLimitModal) {
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
                    scope={googleOAuthScope}
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
                    title={c('loc_nightly: BYOE').t`Connect more Gmail addresses with ${planName}`}
                    description={
                        <>
                            {/*translator: full sentence is "You've connected your 1 Gmail address."*/}
                            <span>
                                {c('loc_nightly: BYOE').ngettext(
                                    msgid`You've connected your ${MAX_SYNC_FREE_USER} Gmail address.`,
                                    `You've connected your ${MAX_SYNC_FREE_USER} Gmail address.`,
                                    MAX_SYNC_FREE_USER
                                )}
                            </span>
                            {/*translator: full sentence is "To connect more, upgrade to Mail Plus and get up to 3 Gmail accounts linked to your inbox."*/}
                            <span>
                                {c('loc_nightly: BYOE').ngettext(
                                    msgid`To connect more, upgrade to ${planName} and get up to ${MAX_SYNC_PAID_USER} Gmail accounts linked to your inbox.`,
                                    `To connect more, upgrade to ${planName} and get up to ${MAX_SYNC_PAID_USER} Gmail accounts linked to your inbox.`,
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
