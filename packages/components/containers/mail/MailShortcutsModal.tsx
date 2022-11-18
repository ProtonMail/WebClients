import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getShortcuts } from '@proton/shared/lib/shortcuts/mail';

import {
    Alert,
    Field,
    Label,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Row,
    ShortcutsSectionView,
} from '../../components';
import { classnames } from '../../helpers';
import { useMailSettings } from '../../hooks';
import ShortcutsToggle from '../general/ShortcutsToggle';

import './MailShortcutsModal.scss';

const MailShortCutsModal = (props: ModalProps) => {
    const title = c('Title').t`${MAIL_APP_NAME} Keyboard Shortcuts`;
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();
    const mailShortcuts = getShortcuts();
    const alwaysOnSections = mailShortcuts.filter((section) => section.alwaysActive);
    const shortcutEnabledSections = mailShortcuts.filter((section) => !section.alwaysActive);

    const { onClose } = props;

    return (
        <ModalTwo className="shortcut-modal" {...props}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <Alert className="mb1">
                    {c('Info')
                        .t`Basic navigation and actions remain available regardless of keyboard shortcuts being active or not in the settings.`}
                </Alert>
                <div className="list-2columns on-mobile-list-1column mr-2 on-mobile-mr0">
                    {alwaysOnSections.map((section) => {
                        return <ShortcutsSectionView key={section.name} {...section} />;
                    })}
                </div>

                <hr className="mt2 mb2 border-bottom" />
                <Row className="mb2">
                    <Label htmlFor="toggle-shortcuts" className="mr1">{c('Label').t`Keyboard shortcuts`}</Label>
                    <Field className="pt0-5">
                        <ShortcutsToggle id="toggle-shortcuts" />
                    </Field>
                </Row>
                <div
                    className={classnames([
                        'list-2columns on-mobile-list-1column mr-2 on-mobile-mr0',
                        !Shortcuts && 'opacity-50',
                    ])}
                >
                    {shortcutEnabledSections.map((section) => {
                        return <ShortcutsSectionView key={section.name} {...section} />;
                    })}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="mlauto" onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default MailShortCutsModal;
