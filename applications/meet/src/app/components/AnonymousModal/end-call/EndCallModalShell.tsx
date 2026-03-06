import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import upsellModalIcon from '@proton/styles/assets/img/meet/upsell-modal-icon.svg';

import { CTAModalShell } from '../shared/CTAModalShell';
import { FeedbackForm } from './FeedbackForm';
import { FeedbackThankYou } from './FeedbackThankYou';

type EndCallModalShellProps = {
    open: boolean;
    onClose: () => void;
    actions?: ReactNode;
    rejoin?: () => void;
    title: ReactNode;
    subtitle: ReactNode;
};

export const EndCallModalShell = ({ open, onClose, actions, rejoin, title, subtitle }: EndCallModalShellProps) => {
    const [isFinished, setIsFinished] = useState(false);

    const onSubmit = () => {
        setIsFinished(true);
    };

    if (isFinished) {
        return <FeedbackThankYou open={open} onClose={onClose} />;
    }

    return (
        <CTAModalShell
            open={open}
            onClose={onClose}
            icon={
                <img
                    src={upsellModalIcon}
                    alt=""
                    className="w-custom h-custom"
                    style={{ '--w-custom': '4.5em', '--h-custom': '4.5em' }}
                />
            }
            title={title}
            subtitle={subtitle}
            headerClassName="pt-10"
            titleClassName="text-semibold"
            actions={
                <>
                    <div className="flex flex-column md:flex-row gap-2 items-center w-full">{actions}</div>
                    {rejoin && (
                        <div className="w-full flex justify-center gap-2 pt-10 pb-5 text-semibold max-w-custom">
                            <span className="color-weak">{c('Info').t`Left by mistake?`}</span>
                            <InlineLinkButton
                                className="rejoin-meeting-button"
                                onClick={() => {
                                    rejoin();
                                    onClose();
                                }}
                            >{c('Action').t`Rejoin meeting`}</InlineLinkButton>
                        </div>
                    )}
                </>
            }
            footer={<FeedbackForm onClose={onClose} onSubmit={onSubmit} />}
        />
    );
};
