import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

interface Props {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

export const GuestLocalSaveOption = ({ enabled, onChange }: Props) => {
    const toggleId = 'paper-trail-save-locally';

    return (
        <div className="ai-paper-trail__save-option">
            <Toggle
                id={toggleId}
                checked={enabled}
                onChange={(event) => {
                    onChange(event.target.checked);
                }}
                className="ai-paper-trail__save-toggle shrink-0"
            />
            <label htmlFor={toggleId} className="ai-paper-trail__save-copy text-start">
                <span className="text-sm text-semibold">
                    {c('collider_2025:Label').t`Save report on this device to view it later`}
                </span>
                <span className="ai-paper-trail__muted text-sm">
                    {c('collider_2025:Info')
                        .t`Your report is stored unencrypted in this browser only. It never leaves your device and is not sent to ${LUMO_SHORT_APP_NAME}'s servers.`}
                </span>
            </label>
        </div>
    );
};
