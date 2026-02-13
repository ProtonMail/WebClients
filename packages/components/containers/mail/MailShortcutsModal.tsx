import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import Field from '@proton/components/components/container/Field';
import Row from '@proton/components/components/container/Row';
import Label from '@proton/components/components/label/Label';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import ShortcutsSectionView from '@proton/components/components/shortcuts/ShortcutsSectionView';
import { getCategoryCommanderKeyboardShortcut } from '@proton/mail/features/categoriesView/categoriesHelpers';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { getLabelFromCategoryIdInCommander } from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getKeyboardShortcutsWithAppName } from '@proton/shared/lib/shortcuts/i18n';
import { getShortcuts } from '@proton/shared/lib/shortcuts/mail';
import clsx from '@proton/utils/clsx';

import ShortcutsToggle from '../general/ShortcutsToggle';

import './MailShortcutsModal.scss';

const MailShortCutsModal = (props: ModalProps) => {
    const title = getKeyboardShortcutsWithAppName(MAIL_APP_NAME);
    const [mailSettings] = useMailSettings();

    const { activeCategoriesTabs } = useCategoriesData();
    const categoriesShortcuts = activeCategoriesTabs.map((tab) => {
        return {
            name: getLabelFromCategoryIdInCommander(tab.id),
            keys: getCategoryCommanderKeyboardShortcut(tab.id),
        };
    });

    const mailShortcuts = getShortcuts(categoriesShortcuts);
    const alwaysOnSections = mailShortcuts.filter((section) => section.alwaysActive);
    const shortcutEnabledSections = mailShortcuts.filter((section) => !section.alwaysActive);

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
                <div className={clsx('columns-1 md:columns-2 gap-8', !mailSettings.Shortcuts && 'opacity-50')}>
                    {shortcutEnabledSections.map((section) => {
                        return <ShortcutsSectionView key={section.name} {...section} />;
                    })}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="ml-auto" onClick={props.onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default MailShortCutsModal;
