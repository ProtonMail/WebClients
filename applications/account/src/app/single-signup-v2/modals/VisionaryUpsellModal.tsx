import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { Icon, ModalTwo, ModalTwoContent, ModalTwoFooter, StripedItem, StripedList } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import svg from '../welcome-suite.svg';

interface Props extends ModalProps {
    plan: string;
    appName: string;
    onUpgrade: () => void;
    onContinue: () => void;
}

const VisionaryUpsellModal = ({ plan, appName, onClose, onUpgrade, onContinue, ...rest }: Props) => {
    return (
        <ModalTwo {...rest} disableCloseOnEscape={true} size="small">
            <ModalTwoContent>
                <div className="flex flex-column gap-4 pt-4">
                    <img src={svg} alt="" />
                    <div className="text-center text-bold h3">{c('bf2023: Info')
                        .t`The ${plan} plan is back for a limited time only`}</div>
                    <div className="text-center color-weak">
                        {c('bf2023: Info')
                            .t`Become a super-supporter. Get access to all current and future ${BRAND_NAME} services.`}
                    </div>
                    <div>
                        <StripedList alternate="odd" className="my-0">
                            {[
                                {
                                    key: 1,
                                    right: c('bf2023: Info').t`Premium versions of all ${BRAND_NAME} services`,
                                },
                                {
                                    key: 2,
                                    right: c('bf2023: Info').t`Exclusive features and early access`,
                                },
                                {
                                    key: 3,
                                    right: c('bf2023: Info').t`Help us fight for online privacy`,
                                },
                                {
                                    key: 4,
                                    right: c('bf2023: Info').t`6 TB storage (2x more than any other plan)`,
                                },
                                {
                                    key: 5,
                                    right: c('bf2023: Info').t`6 users`,
                                },
                            ].map(({ key, right }) => {
                                return (
                                    <StripedItem
                                        key={key}
                                        left={<Icon className="color-success" name="checkmark" size={5} />}
                                    >
                                        {right}
                                    </StripedItem>
                                );
                            })}
                        </StripedList>
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button shape="ghost" color="norm" fullWidth onClick={onContinue}>
                    {c('pass_signup_2023: Action').t`Start using ${appName}`}
                </Button>
                <Button color="norm" fullWidth className="mb-1" onClick={onUpgrade}>
                    {c('bf2023: Action').t`Become a Visionary`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default VisionaryUpsellModal;
