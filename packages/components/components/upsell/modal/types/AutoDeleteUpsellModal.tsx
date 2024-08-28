import { c } from 'ttag';

import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import { useUpsellConfig } from '../..';
import type { ModalStateProps } from '../../../modalTwo';
import useOneDollarConfig from '../../useOneDollarPromo';
import { UpsellModal } from '../index';

interface Props {
    modalProps: ModalStateProps;
    upsellComponent?: UPSELL_COMPONENT;
}

const AutoDeleteUpsellModal = ({ modalProps, upsellComponent }: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.AUTO_DELETE,
    });
    const oneDollarConfig = useOneDollarConfig();
    const upsellConfig = useUpsellConfig({ upsellRef, ...oneDollarConfig });

    return (
        <UpsellModal
            data-testid="auto-delete:banner:upsell-modal"
            modalProps={modalProps}
            features={[
                'auto-delete-trash-and-spam',
                'more-storage',
                'more-email-addresses',
                'unlimited-folders-and-labels',
                'custom-email-domains',
            ]}
            description={c('Description')
                .t`Auto-delete spam and trashed messages and unlock more premium features when you upgrade.`}
            title={c('Title').t`Clear out the junk`}
            {...upsellConfig}
        />
    );
};

export default AutoDeleteUpsellModal;
