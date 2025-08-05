import MailCustomStep from '../defaultCustomStep/CustomStep';
import type { SignupCustomStepProps } from '../interface';

const CustomStepNoExplore = (props: SignupCustomStepProps) => {
    return <MailCustomStep {...props} hasExploreStep={false} />;
};

const CustomStepExplore = (props: SignupCustomStepProps) => {
    return <MailCustomStep {...props} hasExploreStep={true} />;
};

export const getCustomStep = ({ hasExploreStep }: { hasExploreStep: boolean }) => {
    return hasExploreStep ? CustomStepExplore : CustomStepNoExplore;
};
