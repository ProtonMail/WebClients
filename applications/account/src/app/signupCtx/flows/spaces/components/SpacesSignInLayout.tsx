import type { ComponentProps, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';

import Content from '../../../../public/Content';
import { ScrollToTop } from '../../../../sign-in/components/ScrollToTop';
import type {
    SignInLayout,
    SignInLayoutHeaderProps,
    SignInLayoutProps,
} from '../../../../sign-in/components/SignInLayout';
import type InvitePanel from './InvitePanel';
import Layout from './Layout';
import Title from './Title';

export const getSpacesSignInLayout = (invite?: ComponentProps<typeof InvitePanel>): SignInLayout => ({
    Shell: function SpacesSignInShell({ children }: SignInLayoutProps) {
        return <Layout invite={invite}>{children}</Layout>;
    },
    Header: function SpacesSignInHeader({ title, subTitle, onBack }: SignInLayoutHeaderProps) {
        const hasAccount = !!subTitle && typeof subTitle !== 'string';
        const canGoBack = !!onBack && (hasAccount || !invite);
        return (
            <>
                <div className="relative">
                    {canGoBack && (
                        <Button
                            icon
                            shape="solid"
                            color="weak"
                            className="absolute left-0 top-0 rounded-lg"
                            title={c('Action').t`Back`}
                            onClick={onBack}
                        >
                            <IcArrowLeft alt={c('Action').t`Back`} />
                        </Button>
                    )}
                    {title && <Title spaced={!hasAccount}>{title}</Title>}
                </div>
                {hasAccount && <div className="spaces-text-md color-weak flex justify-center mb-8">{subTitle}</div>}
            </>
        );
    },
    Body: function SpacesSignInBody({ children }: { children: ReactNode }) {
        return (
            <Content>
                <ScrollToTop />
                {children}
            </Content>
        );
    },
});
