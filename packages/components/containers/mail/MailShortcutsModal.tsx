import { c } from 'ttag';

import { Banner, Button } from '@proton/atoms';
import Field from '@proton/components/components/container/Field';
import Row from '@proton/components/components/container/Row';
import Label from '@proton/components/components/label/Label';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import ShortcutsSectionView from '@proton/components/components/shortcuts/ShortcutsSectionView';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';
import { getKeyboardShortcutsWithAppName } from '@proton/shared/lib/shortcuts/i18n';
import { getShortcuts } from '@proton/shared/lib/shortcuts/mail';
import clsx from '@proton/utils/clsx';

import ShortcutsToggle from '../general/ShortcutsToggle';

import './MailShortcutsModal.scss';

const MailShortCutsModal = (props: ModalProps) => {
    const title = getKeyboardShortcutsWithAppName(MAIL_APP_NAME);
    const [{ Shortcuts } = DEFAULT_MAILSETTINGS] = useMailSettings();
    const mailShortcuts = getShortcuts();
    const alwaysOnSections = mailShortcuts.filter((section) => section.alwaysActive);
    const shortcutEnabledSections = mailShortcuts.filter((section) => !section.alwaysActive);

    const { onClose } = props;

    return (
        <ModalTwo className="shortcut-modal" {...props}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <Banner className="mb-4" variant="info">
                    {c('Info')
                        .t`Basic navigation and actions remain available regardless of keyboard shortcuts being active or not in the settings.`}
                </Banner>
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
