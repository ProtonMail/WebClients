import { c } from 'ttag';

import { ImportType } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, PrimaryButton } from '@proton/components';

import StepProductsRowItem from '../StepProducts/StepProductsRowItem';
import StepPrepareCalendarSummary from './StepPrepareOAuthCalendarSummary';
import StepPrepareContactsSummary from './StepPrepareOAuthContactsSummary';
import StepPrepareDescription from './StepPrepareOAuthDescription';
import StepPrepareEmailsSummary from './StepPrepareOAuthEmailsSummary';
import StepPrepareErrorBox from './StepPrepareOAuthErrorBox';
import useStepPrepare from './hooks/useStepPrepareOAuth';

const StepPrepare = () => {
    const {
        emailChecked,
        setEmailChecked,
        contactChecked,
        setContactChecked,
        calendarChecked,
        setCalendarChecked,
        importerData,
        handleCancel,
        handleSubmit,
        hasErrors,
        emailTitle,
        enabledFeatures,
        products,
        allCheckboxUnselected,
    } = useStepPrepare();

    const { isEmailsEnabled, isCalendarsEnabled, isContactsEnabled } = enabledFeatures;

    return (
        <ModalTwo size="xlarge" onClose={handleCancel} open>
            <ModalTwoHeader title={c('Title').t`Customize and confirm`} />
            <ModalTwoContent>
                <StepPrepareDescription />

                <StepPrepareErrorBox errors={hasErrors} />

                <div className="max-w-custom" style={{ '--max-w-custom': '30em' }}>
                    {products.includes(ImportType.MAIL) && (
                        <StepProductsRowItem
                            id="mail"
                            label={emailTitle}
                            value={emailChecked}
                            setValue={setEmailChecked}
                            error={importerData?.emails?.error}
                            disabled={!isEmailsEnabled}
                        >
                            {isEmailsEnabled && <StepPrepareEmailsSummary isSelected={emailChecked} />}
                        </StepProductsRowItem>
                    )}

                    {products.includes(ImportType.CONTACTS) && (
                        <StepProductsRowItem
                            id="contact"
                            label={c('Label').t`Contacts`}
                            value={contactChecked}
                            setValue={setContactChecked}
                            error={importerData?.contacts?.error}
                            disabled={!isContactsEnabled}
                        >
                            {isContactsEnabled && <StepPrepareContactsSummary isSelected={contactChecked} />}
                        </StepProductsRowItem>
                    )}

                    {products.includes(ImportType.CALENDAR) && (
                        <StepProductsRowItem
                            id="calendar"
                            label={c('Label').t`Calendar`}
                            value={calendarChecked}
                            setValue={setCalendarChecked}
                            error={importerData?.calendars?.error}
                            disabled={!isCalendarsEnabled}
                        >
                            {isCalendarsEnabled && <StepPrepareCalendarSummary isSelected={calendarChecked} />}
                        </StepProductsRowItem>
                    )}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button shape="outline" onClick={handleCancel}>
                    {c('Action').t`Cancel`}
                </Button>
                <PrimaryButton onClick={handleSubmit} disabled={hasErrors || allCheckboxUnselected}>{c('Action')
                    .t`Start import`}</PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default StepPrepare;
