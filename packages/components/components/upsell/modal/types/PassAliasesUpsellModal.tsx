import { c } from 'ttag';

import {
    APP_UPSELL_REF_PATH,
    MAIL_UPSELL_PATHS,
    PLANS,
    PLAN_NAMES,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import { ModalStateProps } from '../../../modalTwo';
import { UpsellModal } from '../index';

interface Props {
    modalProps: ModalStateProps;
}

const PassAliasesUpsellModal = ({ modalProps }: Props) => (
    <UpsellModal
        data-testid="security-center:proton-sentinel:upsell-modal"
        modalProps={modalProps}
        features={[]}
        description={c('Description').t`Get unlimited aliases and 500 GB of storage with ${PLAN_NAMES[PLANS.BUNDLE]}.`}
        title={c('Title').t`Need more aliases?`}
        upgradePath={getUpsellRef({
            app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
            component: UPSELL_COMPONENT.MODAL,
            feature: MAIL_UPSELL_PATHS.PASS_ALIASES,
        })}
    />
);

export default PassAliasesUpsellModal;
