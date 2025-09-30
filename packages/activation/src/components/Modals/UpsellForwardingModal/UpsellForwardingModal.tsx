import { c, msgid } from 'ttag';

import { type ModalStateProps, UpsellModal } from '@proton/components';
import useConfig from '@proton/components/hooks/useConfig';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { MAIL_APP_NAME, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import forwardImg from '@proton/styles/assets/img/illustrations/new-upsells-img/easy-switch-forward.svg';

import { MAX_SYNC_FREE_USER, MAX_SYNC_PAID_USER } from '../../../constants';

interface Props {
    hasAccessToBYOE: boolean;
    modalProps: ModalStateProps;
}

const UpsellForwardingModal = ({ hasAccessToBYOE, modalProps }: Props) => {
    const { APP_NAME } = useConfig();
    const planName = PLAN_NAMES[PLANS.MAIL];

    const upsellRef =
        getUpsellRefFromApp({
            app: APP_NAME,
            feature: SHARED_UPSELL_PATHS.EASY_SWITCH_BYOE,
            component: UPSELL_COMPONENT.MODAL,
            fromApp: getAppFromPathnameSafe(window.location.pathname),
        }) || '';

    return (
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
            modalProps={modalProps}
            illustration={forwardImg}
        />
    );
};

export default UpsellForwardingModal;
