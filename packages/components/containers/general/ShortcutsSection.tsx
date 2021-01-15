import React, { useState, useEffect } from 'react';
import { c } from 'ttag';

import { Row, Label, Field, SmallButton } from '../../components';
import { useMailSettings } from '../../hooks';

import ShortcutsToggle from './ShortcutsToggle';

interface Props {
    onOpenShortcutsModal: () => void;
}

const ShortcutsSection = ({ onOpenShortcutsModal }: Props) => {
    const [{ Hotkeys } = { Hotkeys: 0 }] = useMailSettings();
    const [hotkeys, setHotkeys] = useState(Hotkeys);

    // Handle updates from the Event Manager.
    useEffect(() => {
        setHotkeys(Hotkeys);
    }, [Hotkeys]);

    const handleChange = (newValue: number) => setHotkeys(newValue);

    return (
        <Row>
            <Label htmlFor="hotkeysToggle">{c('Title').t`Keyboard shortcuts`}</Label>
            <Field>
                <div>
                    <ShortcutsToggle className="mr1" id="hotkeysToggle" hotkeys={hotkeys} onChange={handleChange} />
                </div>
                <div className="mt1">
                    <SmallButton onClick={onOpenShortcutsModal}>{c('Action').t`View keyboard shortcuts`}</SmallButton>
                </div>
            </Field>
        </Row>
    );
};

export default ShortcutsSection;
