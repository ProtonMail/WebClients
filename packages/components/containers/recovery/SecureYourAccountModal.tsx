import { useCallback } from 'react';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import Modal, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useToggle from '@proton/components/hooks/useToggle';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import recoveryKitImg from '@proton/styles/assets/img/illustrations/recovery-kit.svg';

interface Props extends ModalProps<'form'> {}

/*
    TODO: This is just a component design, it will need to be hooked up to actual functionality later.
    See for example DownloadPhraseContainer among others with similar functionality to download PDF file.

    https://protonag.atlassian.net/browse/VPNBE-1605
*/

const SecureYourAccountModal = (props: Props) => {
    const size = '78KB'; // For testing - don't forget to add translations for the actual value coming from code/api, see humanSize function

    const { state: acknowledged, toggle: toggleAcknowledged } = useToggle(false);

    const handleDownload = useCallback(() => {
        // TODO: Implement download functionality
    }, []);

    return (
        <Modal size="medium" {...props}>
            <ModalHeader
                className="text-xl p-4 pb-0"
                hasClose={false}
                title={c('Header').t`Secure your account`}
                subline={<span className="text-sm">{c('Header').t`Save your Recovery Kit to continue`}</span>}
            />
            <ModalContent className="px-4 mt-6">
                <img src={recoveryKitImg} alt="" className="mb-6 w-full" />
                <div className="flex flex-column gap-2">
                    <div>
                        {getBoldFormattedText(
                            c('Secure Your Account')
                                .t`If you get locked out of your ${BRAND_NAME} Account, your **Recovery Kit** will allow you to sign in and recover your data.`
                        )}
                    </div>
                    <div>
                        {c('Secure Your Account')
                            .t`It’s the only way to fully restore your account, so make sure you keep it somewhere safe.`}
                    </div>
                </div>
                <InlineLinkButton key="download-pdf-button" onClick={handleDownload} className="p-4 my-2">
                    <Icon name="arrow-down-line" />
                    {c('Secure Your Account').t`Download PDF (${size})`}
                </InlineLinkButton>
                <div className="mb-4">
                    <Checkbox id="overflow" checked={acknowledged} onChange={toggleAcknowledged}>
                        {c('Secure Your Account')
                            .t`I understand that if I lose my recovery phrase, I may permanently lose access to my account.`}
                    </Checkbox>
                </div>
            </ModalContent>
            <ModalFooter className="p-4 pt-0">
                <Button disabled={!acknowledged} type="submit" color="norm" fullWidth>
                    {c('Action').t`Continue`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default SecureYourAccountModal;
