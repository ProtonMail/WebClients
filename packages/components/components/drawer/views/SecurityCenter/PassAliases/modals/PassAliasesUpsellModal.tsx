import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import { useUser } from '@proton/components/hooks';
import {
    APP_UPSELL_REF_PATH,
    MAIL_UPSELL_PATHS,
    PLANS,
    PLAN_NAMES,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';

interface Props {
    modalProps: ModalStateProps;
    upsellComponent?: UPSELL_COMPONENT;
}

const PassAliasesUpsellModal = ({ modalProps, upsellComponent }: Props) => {
    const [user] = useUser();

    return (
        <UpsellModal
            data-testid="security-center:proton-sentinel:upsell-modal"
            modalProps={modalProps}
            features={[]}
            description={c('Description')
                .t`Get unlimited aliases and 500 GB of storage with ${PLAN_NAMES[PLANS.BUNDLE]}.`}
            title={c('Title').t`Need more aliases?`}
            upgradePath={addUpsellPath(
                getUpgradePath({
                    user,
                    plan: PLANS.BUNDLE,
                    app: 'proton-mail',
                }),
                getUpsellRef({
                    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
                    component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
                    feature: MAIL_UPSELL_PATHS.PASS_ALIASES,
                })
            )}
        />
    );
};

export default PassAliasesUpsellModal;
