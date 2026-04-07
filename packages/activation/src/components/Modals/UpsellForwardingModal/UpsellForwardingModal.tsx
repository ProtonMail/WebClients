import { c } from 'ttag';

import { type ModalStateProps, UpsellModal } from '@proton/components';
import useConfig from '@proton/components/hooks/useConfig';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { MAIL_APP_NAME, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import forwardImg from '@proton/styles/assets/img/illustrations/new-upsells-img/easy-switch-forward.svg';

import { MAX_SYNC_PAID_USER } from '../../../constants';

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
            title={c('Title').t`Multiple accounts, 1 private inbox`}
            description={
                <>
                    <span>
                        {hasAccessToBYOE
                            ? c('Description').t`You've connected one external account address to ${MAIL_APP_NAME}.`
                            : c('Easy switch')
                                  .t`You're forwarding emails from one external account to ${MAIL_APP_NAME}.`}
                    </span>
                    <span className="ml-1">
                        {hasAccessToBYOE
                            ? /*translator: full sentence is "Upgrade to Mail Plus to connect up to 3 accounts."*/
                              c('Description').t`Upgrade to ${planName} to connect up to ${MAX_SYNC_PAID_USER} accounts`
                            : /*translator: full sentence is "To forward emails from up to 3 accounts, upgrade to Mail Plus."*/
                              c('Easy switch')
                                  .t`To forward emails from up to ${MAX_SYNC_PAID_USER} accounts, upgrade to ${planName}.`}
                    </span>
                </>
            }
            modalProps={modalProps}
            illustration={forwardImg}
        />
    );
};

export default UpsellForwardingModal;
