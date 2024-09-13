import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, PrimaryButton } from '@proton/components';

import StepProductsHeader from './StepProductsHeader';
import StepProductsRowItem from './StepProductsRowItem';
import useStepProducts from './useStepProducts';

interface Props {
    triggerOAuth: (scopes: string[]) => void;
}

const StepProducts = ({ triggerOAuth }: Props) => {
    const {
        mailChecked,
        setMailChecked,
        contactChecked,
        setContactChecked,
        calendarChecked,
        setCalendarChecked,
        handleCancel,
        handleSubmit,
        nextDisabled,
        enabledFeatures,
    } = useStepProducts({ triggerOAuth });

    const { isEmailsEnabled, isCalendarsEnabled, isContactsEnabled } = enabledFeatures;

    return (
        <ModalTwo size="large" onClose={handleCancel} open>
            <StepProductsHeader />
            <ModalTwoContent>
                <div>{c('Info').t`Select what you want to import.`}</div>

                <div className="max-w-custom" style={{ '--max-w-custom': '30em' }} data-testid="StepProducts:modal">
                    <StepProductsRowItem
                        id="mail"
                        label={c('Label').t`Emails`}
                        value={mailChecked}
                        setValue={setMailChecked}
                        disabled={!isEmailsEnabled}
                    />
                    <StepProductsRowItem
                        id="contact"
                        label={c('Label').t`Contacts`}
                        value={contactChecked}
                        setValue={setContactChecked}
                        disabled={!isContactsEnabled}
                    />
                    <StepProductsRowItem
                        id="calendar"
                        label={c('Label').t`Calendar`}
                        value={calendarChecked}
                        setValue={setCalendarChecked}
                        disabled={!isCalendarsEnabled}
                    />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button shape="outline" onClick={handleCancel}>
                    {c('Action').t`Cancel`}
                </Button>
                <PrimaryButton disabled={nextDisabled} onClick={handleSubmit} data-testid="StepProducts:submit">{c(
                    'Action'
                ).t`Start import`}</PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default StepProducts;
