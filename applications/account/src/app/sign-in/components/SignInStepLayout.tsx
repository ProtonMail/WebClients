import type { ReactElement, ReactNode } from 'react';

import { SignInContext } from '../wizard/SignInContext';
import { useSignInProps } from '../wizard/SignInProvider';

export interface SignInStepLayoutProps {
    title: ReactNode;
    subTitle?: string | ReactElement;
    onBack?: () => void;
    beforeMain?: ReactNode;
    children: ReactNode;
}

/** Frames a sign-in step with the layout the page passed in. */
export const SignInStepLayout = ({ title, subTitle, onBack, beforeMain, children }: SignInStepLayoutProps) => {
    const { layout: Layout, toApp } = useSignInProps();
    const hasDecoration = SignInContext.useSelector((snapshot) => snapshot.context.step === 'credentials');

    return (
        <Layout
            title={title}
            subTitle={subTitle}
            onBack={onBack}
            beforeMain={beforeMain}
            toApp={toApp}
            hasDecoration={hasDecoration}
        >
            {children}
        </Layout>
    );
};
