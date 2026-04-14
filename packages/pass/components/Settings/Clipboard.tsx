import type { FC } from 'react';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { ClipboardSettings } from '@proton/pass/components/Settings/Clipboard/ClipboardSettings';

import { SettingsPanel } from './SettingsPanel';

type Props = { disabled?: boolean; activate?: () => Promise<boolean> };

export const Clipboard: FC<Props> = ({ disabled, activate }) => {
    return (
        <SettingsPanel title={c('Label').t`Clear clipboard after`}>
            {disabled && (
                <Banner variant="norm-outline" className="mb-2">
                    {c('Warning').t`Grant clipboard access to enable automatic clearing of copied passwords and data.`}{' '}
                    <InlineLinkButton
                        className="text-underline color-weak inline-flex items-center gap-1"
                        onClick={activate}
                    >
                        {c('Action').t`Allow access`} <IcArrowOutSquare className="shrink-0" />
                    </InlineLinkButton>
                </Banner>
            )}
            <ClipboardSettings disabled={disabled} />
        </SettingsPanel>
    );
};
