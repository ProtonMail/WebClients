import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { metaKey } from '@proton/shared/lib/helpers/browser';
import { getShortcuts } from '@proton/shared/lib/shortcuts/calendar';
import { getKeyboardShortcutsWithAppName } from '@proton/shared/lib/shortcuts/i18n';
import clsx from '@proton/utils/clsx';

import Field from '../../../components/container/Field';
import Row from '../../../components/container/Row';
import Label from '../../../components/label/Label';
import type { ModalProps } from '../../../components/modalTwo/Modal';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import ShortcutsSectionView from '../../../components/shortcuts/ShortcutsSectionView';
import InboxDesktopAppSwitchingShortcuts, {
    showInboxDesktopAppSwitchingShortcuts,
} from '../../desktop/InboxDesktopAppSwitchingShortcuts';
import ShortcutsToggle from '../../general/ShortcutsToggle';

import './CalendarShortcutsModal.scss';

const CalendarShortcutsModal = (props: ModalProps) => {
    const title = getKeyboardShortcutsWithAppName(CALENDAR_APP_NAME);
    const [mailSettings] = useMailSettings();
    const calendarShortcuts = getShortcuts();
    const { onClose } = props;

    return (
        <ModalTwo className="shortcut-modal" {...props}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                {showInboxDesktopAppSwitchingShortcuts && (
                    <>
                        <div className="columns-1 md:columns-2 gap-8">
                            <InboxDesktopAppSwitchingShortcuts />
                        </div>
                        <hr className="my-8 border-bottom" />
                    </>
                )}
                <Banner className="mb-4" variant="info">
                    {c('Info')
                        .t`If keyboard shortcuts are enabled, you can use the following keys for quick actions or to jump to different views. ${metaKey} + K is always enabled.`}
                </Banner>
                <Row className="mb-8">
                    <Label htmlFor="toggle-shortcuts" className="mr-4">{c('Label').t`Keyboard shortcuts`}</Label>
                    <Field className="pt-2">
                        <ShortcutsToggle id="toggle-shortcuts" />
                    </Field>
                </Row>
                <div className={clsx('columns-1 md:columns-2 gap-8', !mailSettings.Shortcuts && 'opacity-50')}>
                    {calendarShortcuts.map((section) => {
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

export default CalendarShortcutsModal;
