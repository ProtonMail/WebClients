import React, { useState, useEffect } from 'react';
import { c } from 'ttag';

import { Row, Label, Field, Button } from '../../components';
import { useMailSettings } from '../../hooks';

import ShortcutsToggle from './ShortcutsToggle';

interface Props {
    onOpenShortcutsModal: () => void;
}

const ShortcutsSection = ({ onOpenShortcutsModal }: Props) => {
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();
    const [shortcuts, setShortcuts] = useState(Shortcuts);

    // Handle updates from the Event Manager.
    useEffect(() => {
        setShortcuts(Shortcuts);
    }, [Shortcuts]);

    const handleChange = (newValue: number) => setShortcuts(newValue);

    return (
        <Row>
            <Label htmlFor="shortcutsToggle">{c('Title').t`Keyboard shortcuts`}</Label>
            <Field className="pt0-5">
                <div>
                    <ShortcutsToggle
                        className="mr1"
                        id="shortcutsToggle"
                        shortcuts={shortcuts}
                        onChange={handleChange}
                    />
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
