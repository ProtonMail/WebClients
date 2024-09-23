import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Label from '@proton/components/components/label/Label';

import Field from '../../components/container/Field';
import Row from '../../components/container/Row';
import ShortcutsToggle from './ShortcutsToggle';

interface Props {
    onOpenShortcutsModal: () => void;
}

const ShortcutsSection = ({ onOpenShortcutsModal }: Props) => {
    return (
        <Row>
            <Label htmlFor="shortcutsToggle">{c('Title').t`Keyboard shortcuts`}</Label>
            <Field className="pt-2">
                <div>
                    <ShortcutsToggle className="mr-4" id="shortcutsToggle" />
                </div>
                <div className="mt-4">
                    <Button size="small" onClick={onOpenShortcutsModal}>{c('Action')
                        .t`Display keyboard shortcuts`}</Button>
                </div>
            </Field>
        </Row>
    );
};

export default ShortcutsSection;
