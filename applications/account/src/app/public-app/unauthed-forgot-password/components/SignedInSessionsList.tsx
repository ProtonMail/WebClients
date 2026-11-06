import { Scroll } from '@proton/atoms/Scroll/Scroll';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import Time from '@proton/components/components/time/Time';
import { IcDesktop } from '@proton/icons/icons/IcDesktop';
import type { ExistingSession } from '@proton/shared/lib/api/reset';

interface Props {
    activeSessions: ExistingSession[];
}

export const SignedInSessionsList = ({ activeSessions }: Props) => {
    if (activeSessions.length === 0) {
        return null;
    }
    return (
        <div className="flex">
            <div className="max-h-custom flex-1" style={{ '--max-h-custom': '12.5rem' }}>
                <Scroll>
                    <InputFieldStackedGroup>
                        {activeSessions?.map(({ CreateTime, LocalizedClientName }, index) => (
                            <InputFieldStacked
                                icon={<IcDesktop className="color-weak" size={5} />}
                                isGroupElement
                                key={index}
                                classname="bg-norm-weak"
                                style={{
                                    '--stacked-field-background': 'var(--background-weak)',
                                }}
                            >
                                <div className="flex flex-column">
                                    <span className="text-semibold">{LocalizedClientName}</span>
                                    <Time sameDayFormat="PPP" format="PPP">
                                        {CreateTime}
                                    </Time>
                                </div>
                            </InputFieldStacked>
                        ))}
                    </InputFieldStackedGroup>
                </Scroll>
            </div>
        </div>
    );
};
