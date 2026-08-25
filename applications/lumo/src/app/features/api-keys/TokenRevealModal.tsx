import { useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';

export const TokenRevealModal = ({ token, onClose }: { token: string; onClose: () => void }) => {
    const { createNotification } = useNotifications();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        void navigator.clipboard.writeText(token);
        setCopied(true);
        createNotification({ text: c('collider_2025: Notification').t`API key copied to clipboard` });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="api-keys-token-reveal fixed inset-0 flex items-center justify-center p-4">
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="api-keys-token-reveal-overlay absolute inset-0" onClick={onClose} />
            <div className="api-keys-token-reveal-dialog relative overflow-hidden">
                <div className="api-keys-token-reveal-header flex items-start justify-space-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="api-keys-token-reveal-icon flex items-center justify-center shrink-0 rounded-lg">
                            <LumoIcon name="KeyRound" size={20} />
                        </div>
                        <div>
                            <h3 className="api-keys-token-reveal-title m-0 mb-1">
                                {c('collider_2025: Title').t`Your new API key`}
                            </h3>
                            <p className="api-keys-token-reveal-subtitle m-0">
                                {c('collider_2025: Description').t`Keep it safe — it won't be shown again`}
                            </p>
                        </div>
                    </div>
                    <Button icon shape="ghost" size="small" onClick={onClose} title={c('Action').t`Close`}>
                        <LumoIcon name="X" size={16} />
                    </Button>
                </div>

                <div className="api-keys-token-reveal-body">
                    <div className="api-keys-token-warning flex items-center gap-2 rounded-lg mb-4">
                        <LumoIcon name="CircleAlert" size={16} className="shrink-0" />
                        {c('collider_2025: Warning').t`This is the only time you'll see this key. Copy it now.`}
                    </div>

                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <div className="api-keys-token-box relative rounded-lg mb-4" onClick={handleCopy}>
                        <span className="api-keys-token-text block">{token}</span>
                        <span
                            className={`api-keys-token-copied absolute ${copied ? 'api-keys-token-copied--visible' : ''}`}
                        >
                            {c('collider_2025: Status').t`Copied!`}
                        </span>
                    </div>

                    <div className="flex flex-row gap-2">
                        <Button color="weak" className="flex-1" onClick={onClose}>
                            {c('Action').t`Close`}
                        </Button>

                        <Button color="norm" className="flex-1" onClick={handleCopy}>
                            {c('Action').t`Copy API key`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
