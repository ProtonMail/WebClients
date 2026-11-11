import type { ReactNode } from 'react';

import { Aside } from '../Layout/Aside';
import { Footer } from '../Layout/Footer';
import Header from '../Layout/Header';
import Layout from '../Layout/Layout';
import { Main } from '../Layout/Main';
import { Wrapper } from '../Layout/Wrapper';
import { PageHeader } from './PageHeader';
import type { BusinessSignupStep } from './StepIndicator';

interface Props {
    currentStep: BusinessSignupStep;
    completedSteps?: BusinessSignupStep[];
    /** Rendered in the Aside column when present; omitted entirely (no empty Aside) otherwise. */
    aside?: ReactNode;
    children: ReactNode;
}

/**
 * The page shell for the native checkout steps — header, headline + step indicator, the
 * Main/Aside row (Aside only when `aside` is passed), and footer.
 */
export const StepLayout = ({ currentStep, completedSteps, aside, children }: Props) => (
    <Layout>
        <Header />

        <PageHeader currentStep={currentStep} completedSteps={completedSteps} />

        <Wrapper className={aside ? 'items-start' : 'items-center'}>
            <Main>{children}</Main>
            {aside && <Aside>{aside}</Aside>}
        </Wrapper>

        <Footer />
    </Layout>
);
