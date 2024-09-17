import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';
import { getShortcuts } from '@proton/shared/lib/shortcuts/mail';
import clsx from '@proton/utils/clsx';

import type { ModalProps } from '../../components';
import {
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    ShortcutsSectionView,
} from '../../components';
import Field from '../../components/container/Field';
import Row from '../../components/container/Row';
import { useMailSettings } from '../../hooks';
import ShortcutsToggle from '../general/ShortcutsToggle';

import './MailShortcutsModal.scss';

const MailShortCutsModal = (props: ModalProps) => {
    const title = c('Title').t`${MAIL_APP_NAME} Keyboard Shortcuts`;
    const [{ Shortcuts } = DEFAULT_MAILSETTINGS] = useMailSettings();
    const mailShortcuts = getShortcuts();
    const alwaysOnSections = mailShortcuts.filter((section) => section.alwaysActive);
    const shortcutEnabledSections = mailShortcuts.filter((section) => !section.alwaysActive);

    const { onClose } = props;

    return (
        <ModalTwo className="shortcut-modal" {...props}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <Alert className="mb-4">
                    {c('Info')
                        .t`Basic navigation and actions remain available regardless of keyboard shortcuts being active or not in the settings.`}
                </Alert>
                <div className="columns-1 md:columns-2 gap-8">
                    {alwaysOnSections.map((section) => {
                        return <ShortcutsSectionView key={section.name} {...section} />;
                    })}
                </div>

                <hr className="my-8 border-bottom" />
                <Row className="mb-8">
                    <Label htmlFor="toggle-shortcuts" className="mr-4">{c('Label').t`Keyboard shortcuts`}</Label>
                    <Field className="pt-2">
                        <ShortcutsToggle id="toggle-shortcuts" />
                    </Field>
                </Row>
                <div className={clsx('columns-1 md:columns-2 gap-8', !Shortcuts && 'opacity-50')}>
                    {shortcutEnabledSections.map((section) => {
                        return <ShortcutsSectionView key={section.name} {...section} />;
                    })}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="ml-auto" onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default MailShortCutsModal;
