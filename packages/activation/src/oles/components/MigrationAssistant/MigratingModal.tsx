import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import useBeforeUnload from '@proton/components/hooks/useBeforeUnload';
import { BRAND_NAME } from '@proton/shared/lib/constants';

const MigratingModal = () => {
    useBeforeUnload(true);

    return (
        <ModalTwo open size="small" className="rounded-xxl">
            <ModalTwoContent>
                <div className="text-center pt-12 pb-6">
                    <CircleLoader className="color-primary" size="medium" srLabelHidden />
                    <h2 className="text-center text-lg text-semibold my-4">
                        {c('BOSS').t`Creating accounts`}
                        <EllipsisLoader />
                    </h2>
                    <div className="color-weak text-wrap-balance">
                        <p>{c('BOSS')
                            .t`Hang tight, we're setting up user accounts and will start importing user data shortly.`}</p>
                        <p>{c('BOSS')
                            .t`As soon as the accounts are created, you can share the activation link so users can claim their ${BRAND_NAME} account.`}</p>
                        <p>{c('BOSS')
                            .t`Users can use ${BRAND_NAME} or Google simultaneously for the duration of the migration.`}</p>
                        <p className="text-italic">{c('BOSS')
                            .t`Please leave this window open until we're done creating all the users.`}</p>
                    </div>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default MigratingModal;
