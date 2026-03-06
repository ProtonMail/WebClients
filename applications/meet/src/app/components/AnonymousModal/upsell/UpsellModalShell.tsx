import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import SettingsLink from '@proton/components/components/link/SettingsLink';

import { MeetSignIn } from '../../SignIn/SignIn';
import { CTAModalShell } from '../shared/CTAModalShell';

type UpsellModalShellProps = {
    open: boolean;
    onClose: () => void;
    action: () => void;
    icon: ReactNode;
    title: ReactNode;
    subtitle: ReactNode;
};

export const UpsellModalShell = ({ open, onClose, action, icon, title, subtitle }: UpsellModalShellProps) => {
    const signIn = (
        <MeetSignIn key="signin" className="sign-in-button p-0 ml-1">
            {c('Link').t`Sign in`}
        </MeetSignIn>
    );

    return (
        <CTAModalShell
            open={open}
            onClose={onClose}
            icon={icon}
            title={title}
            subtitle={subtitle}
            headerClassName="upsell-modal pt-6 meet-glow-effect relative"
            titleClassName="upsell-modal-title font-arizona"
            actions={
                <SettingsLink className="w-full" path="/dashboard" target="_blank">
                    <Button
                        className="rounded-full px-10 py-4 text-semibold primary w-full upsell-modal-button"
                        onClick={() => {
                            onClose();
                            action();
                        }}
                        size="medium"
                    >
                        {c('Action').t`Continue`}
                    </Button>
                </SettingsLink>
            }
            footer={
                <div className="sign-in-button-container flex flex-row items-baseline py-6 max-w-custom">
                    {c('Go to sign in').jt`Already have an account? ${signIn}`}
                </div>
            }
        />
    );
};
