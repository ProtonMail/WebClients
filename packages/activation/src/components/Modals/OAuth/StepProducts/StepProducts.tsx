import { c } from 'ttag';

import BYOEClaimProtonAddressModal from '@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import { Button, InlineLinkButton } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, useModalState } from '@proton/components';
import useGetOrCreateCalendarAndSettings from '@proton/components/hooks/useGetOrCreateCalendarAndSettings';
import { APPS, BRAND_NAME, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

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
        isBYOEOnlyAccount,
    } = useStepProducts({ triggerOAuth });
    const getOrCreateCalendarAndSettings = useGetOrCreateCalendarAndSettings();

    const [claimProtonAddressModalProps, setClaimProtonAddressModalProps, renderClaimProtonAddressModal] =
        useModalState();

    const { isEmailsEnabled, isCalendarsEnabled, isContactsEnabled } = enabledFeatures;

    const claimAddressButton = (
        <InlineLinkButton onClick={() => setClaimProtonAddressModalProps(true)}>
            {c('Action').t`Get a free ${BRAND_NAME} address`}
        </InlineLinkButton>
    );

    return (
        <>
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
                            disabled={!isCalendarsEnabled || isBYOEOnlyAccount}
                            disabledText={
                                isBYOEOnlyAccount
                                    ? /*translator: full sentence is "Proton calendar requires a Proton address for secure event sync and encryption. Create a free Proton address."*/
                                      c('Info')
                                          .jt`${CALENDAR_APP_NAME} requires a ${BRAND_NAME} address for secure event sync and encryption. ${claimAddressButton}.`
                                    : undefined
                            }
                        />
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button shape="outline" onClick={handleCancel}>
                        {c('Action').t`Cancel`}
                    </Button>
                    <Button
                        color="norm"
                        disabled={nextDisabled}
                        onClick={handleSubmit}
                        data-testid="StepProducts:submit"
                    >{c('Action').t`Start import`}</Button>
                </ModalTwoFooter>
            </ModalTwo>

            {renderClaimProtonAddressModal && (
                <BYOEClaimProtonAddressModal
                    toApp={APPS.PROTONMAIL}
                    onCreateCalendar={getOrCreateCalendarAndSettings}
                    {...claimProtonAddressModalProps}
                />
            )}
        </>
    );
};

export default StepProducts;
