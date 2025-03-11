import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/index';
import Icon from '@proton/components/components/icon/Icon';
import Modal, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

export interface Props extends ModalProps {
    APP_NAME: APP_NAMES;
    onOpenBugModal: () => void;
}

const HelpModal = ({ APP_NAME, onOpenBugModal, ...rest }: Props) => {
    const userVoiceLinks: Partial<{ [key in APP_NAMES]: string }> = {
        [APPS.PROTONMAIL]: 'https://protonmail.uservoice.com/',
        [APPS.PROTONCALENDAR]: 'https://protonmail.uservoice.com/forums/932842-proton-calendar',
        [APPS.PROTONDRIVE]: 'https://protonmail.uservoice.com/forums/932839-proton-drive',
        [APPS.PROTONVPN_SETTINGS]: 'https://protonmail.uservoice.com/forums/932836-protonvpn',
    };

    return (
        <Modal {...rest}>
            <ModalHeader title={c('Title').t`Help and feedback`} />
            <ModalContent>
                <ul className="unstyled">
                    <li className="py-2 border-bottom">
                        <Button
                            className="inline-flex gap-2 justify-between items-center"
                            shape="ghost"
                            fullWidth
                            data-testid="userdropdown:help:link:open-bug-modal"
                            onClick={onOpenBugModal}
                        >
                            <Icon name="bug" className="shrink-0" />
                            <span>{c('Action').t`Report a problem`}</span>
                        </Button>
                    </li>
                    <li className="py-2 border-bottom">
                        <ButtonLike
                            as="a"
                            className="inline-flex gap-2 justify-between items-center"
                            shape="ghost"
                            fullWidth
                            href={userVoiceLinks[APP_NAME] || userVoiceLinks[APPS.PROTONMAIL]}
                            target="_blank"
                            data-testid="userdropdown:help:link:request-feature"
                        >
                            <Icon name="lightbulb" className="shrink-0" />
                            <span>{c('Action').t`Request a feature`}</span>
                            <Icon name="arrow-out-square" className="ml-auto shrink-0 color-hint" />
                        </ButtonLike>
                    </li>
                    <li className="py-2">
                        <ButtonLike
                            as="a"
                            className="inline-flex gap-2 justify-between items-center"
                            shape="ghost"
                            fullWidth
                            href={
                                APP_NAME === APPS.PROTONVPN_SETTINGS
                                    ? 'https://protonvpn.com/support/'
                                    : getStaticURL('/support')
                            }
                            target="_blank"
                            data-testid="userdropdown:help:link:question"
                        >
                            <Icon name="question-circle" className="shrink-0" />
                            {c('Action').t`Help and resources`}
                            <Icon name="arrow-out-square" className="ml-auto shrink-0 color-hint" />
                        </ButtonLike>
                    </li>
                </ul>
            </ModalContent>
        </Modal>
    );
};

export default HelpModal;
