import { c } from 'ttag';

import { Row, Label, Field, Button } from '../../components';
import ShortcutsToggle from './ShortcutsToggle';

interface Props {
    onOpenShortcutsModal: () => void;
}

const ShortcutsSection = ({ onOpenShortcutsModal }: Props) => {
    return (
        <Row>
            <Label htmlFor="shortcutsToggle">{c('Title').t`Keyboard shortcuts`}</Label>
            <Field className="pt0-5">
                <div>
                    <ShortcutsToggle className="mr1" id="shortcutsToggle" />
                </div>
                <div className="mt1">
                    <Button size="small" onClick={onOpenShortcutsModal}>{c('Action')
                        .t`Display keyboard shortcuts`}</Button>
                </div>
            </Field>
        </Row>
    );
};

export default ShortcutsSection;
