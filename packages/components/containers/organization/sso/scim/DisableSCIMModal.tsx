import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useLoading from '@proton/hooks/useLoading';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import getBoldFormattedText from '../../../../helpers/getBoldFormattedText';

interface Props extends Omit<ModalProps, 'children' | 'title' | 'buttons'> {
    onConfirm: () => Promise<void>;
}

const DisableSCIMModal = ({ onClose, onConfirm, ...props }: Props) => {
    const [loading, withLoading] = useLoading();

    return (
        <ModalTwo {...props} onClose={onClose}>
            <ModalTwoHeader title={c('scim: Title').t`Disable SCIM integration?`} {...props} />
            <ModalTwoContent>
                <p>
                    <b>{c('scim: Info').t`This will delete your SCIM base URL and token.`}</b>
                </p>
                <p className="mb-0">{c('scim: Info').t`When you disable SCIM:`}</p>
                <ul className="mt-2">
                    <li className="mb-2">
                        {getBoldFormattedText(
                            c('scim: Info')
                                .t`**Users:** All SCIM users provided automatically by your identity provider will be converted to SSO users and you will be able to manage them directly within the ${BRAND_NAME} settings.`
                        )}
                    </li>
                    <li>
                        {getBoldFormattedText(
                            c('scim: Info')
                                .t`**Groups:** All groups convert to local ${BRAND_NAME} groups. Syncing with your identity provider stops, and you'll manage membership in ${BRAND_NAME} settings instead.`
                        )}
                    </li>
                </ul>
                <Banner variant={BannerVariants.DANGER} icon={<IcExclamationCircleFilled />} className="my-4 pr-1">{c(
                    'scim: Info'
                ).t`Re-enabling syncing will duplicate existing groups. They can't be merged back into SCIM.`}</Banner>
                <p>
                    {c('scim: Info')
                        .t`To re-enable syncing with your identity provider, you need to complete the SCIM integration again.`}
                </p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="danger"
                    loading={loading}
                    onClick={() => {
                        withLoading(onConfirm()).catch(noop);
                    }}
                >
                    {c('scim: Action').t`Disable SCIM`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DisableSCIMModal;
