import { useMemo } from 'react';

import { c } from 'ttag';

import { ColorPicker, Spotlight, UpsellModal, useModalState, useSpotlightShow } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import { useSpotlightOnFeature, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { APP_UPSELL_REF_PATH, CALENDAR_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';

interface Props {
    model: EventModel;
    setModel: (value: EventModel) => void;
    isNarrow: boolean;
    isDrawerApp?: boolean;
}

const EventColorSelect = ({ model, setModel, isNarrow, isDrawerApp }: Props) => {
    const [{ hasPaidMail }] = useUser();
    const [{ isWelcomeFlow }] = useWelcomeFlags();
    const [upsellModalProps, setUpsellModal, renderUpsellModal] = useModalState();
    const color = useMemo(() => {
        // If free user, we always display the calendar color, otherwise we display the event color if set
        const eventColorToShow = hasPaidMail ? model.color : undefined;
        return eventColorToShow || model.calendar.color;
    }, [model.calendar.color, model.color, hasPaidMail]);
    const {
        show: showColorSpotlight,
        onDisplayed,
        onClose,
    } = useSpotlightOnFeature(FeatureCode.CalendarEventColorSpotlight, !isNarrow && !isWelcomeFlow, {
        alpha: Date.UTC(2023, 10, 15, 12),
        beta: Date.UTC(2023, 10, 15, 12),
        default: Date.UTC(2023, 10, 15, 12),
    });
    const shouldShowColorSpotlight = useSpotlightShow(showColorSpotlight && hasPaidMail);

    const handleChangeColor = (color: string) => {
        setModel({
            ...model,
            color,
        });
    };

    const handleClickColorPicker = (toggleColorPicker: () => void) => {
        // Close the spotlight if open when clicking on the color select
        if (shouldShowColorSpotlight) {
            onClose();
        }

        if (hasPaidMail) {
            toggleColorPicker();
        } else {
            // If the user is free, the color picker should not be available. We open an upsell modal instead.
            setUpsellModal(true);
        }
    };

    // Wrap the children in a div to show spotlight
    return (
        <>
            <Spotlight
                content={
                    <>
                        <div className="text-lg text-bold mb-1">{c('Spotlight').t`Color-coding is here!`}</div>
                        <p className="m-0">{c('Spotlight')
                            .t`With customizable event colors, you can color-code the chaos and conquer your day.`}</p>
                    </>
                }
                show={shouldShowColorSpotlight}
                originalPlacement="right"
                onDisplayed={onDisplayed}
            >
                <div className="flex-item-noshrink">
                    <ColorPicker
                        color={color}
                        onChange={handleChangeColor}
                        displayColorName={false}
                        className="ml-2"
                        onClickColorPicker={handleClickColorPicker}
                    />
                </div>
            </Spotlight>

            {renderUpsellModal && (
                <UpsellModal
                    data-testid="color-per-event:upsell-modal"
                    modalProps={upsellModalProps}
                    features={['more-storage', 'more-email-addresses', 'more-calendars', 'calendar-sharing']}
                    description={c('Description')
                        .t`Boost efficiency and track your time by color-coding events by category or your energy levels. Get this and much more with a paid plan.`}
                    title={c('Title').t`Add some color to your day`}
                    upsellRef={getUpsellRef({
                        app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
                        component: UPSELL_COMPONENT.MODAL,
                        feature: CALENDAR_UPSELL_PATHS.COLOR_PER_EVENT,
                    })}
                    headerType="calendar"
                    hideInfo={isDrawerApp}
                />
            )}
        </>
    );
};

export default EventColorSelect;
