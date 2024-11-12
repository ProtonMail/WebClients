import { useMemo } from 'react';

import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account';
import { useUser } from '@proton/account/user/hooks';
import {
    Badge,
    ColorPicker,
    NewUpsellModal,
    Spotlight,
    UpsellModal,
    useModalState,
    useSpotlightOnFeature,
    useSpotlightShow,
    useUpsellConfig,
} from '@proton/components';
import useOneDollarConfig from '@proton/components/components/upsell/useOneDollarPromo';
import { FeatureCode } from '@proton/features';
import { APPS, APP_UPSELL_REF_PATH, CALENDAR_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef, useNewUpsellModalVariant } from '@proton/shared/lib/helpers/upsell';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';
import paintImg from '@proton/styles/assets/img/illustrations/new-upsells-img/paint.svg';

interface Props {
    model: EventModel;
    setModel: (value: EventModel) => void;
    isSmallViewport: boolean;
    isDrawerApp?: boolean;
}

const EventColorSelect = ({ model, setModel, isSmallViewport, isDrawerApp }: Props) => {
    const [user] = useUser();
    const hasPaidMail = user.hasPaidMail;
    const { welcomeFlags: { isWelcomeFlow } } = useWelcomeFlags();
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
    } = useSpotlightOnFeature(FeatureCode.CalendarEventColorSpotlight, !isSmallViewport && !isWelcomeFlow);
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

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: CALENDAR_UPSELL_PATHS.COLOR_PER_EVENT,
    });

    const oneDollarConfig = useOneDollarConfig();
    const upsellConfig = useUpsellConfig({ upsellRef, ...oneDollarConfig });

    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();

    const modal = displayNewUpsellModalsVariant ? (
        <NewUpsellModal
            data-testid="color-per-event:upsell-modal"
            titleModal={c('Title').t`Add some color to your day`}
            description={c('Description')
                .t`Color-code events to make it easier to organize your day, track your time, and prioritize tasks.`}
            modalProps={upsellModalProps}
            sourceEvent="BUTTON_COLOR_PER_EVENT"
            application={APPS.PROTONCALENDAR}
            illustration={paintImg}
            {...upsellConfig}
        />
    ) : (
        <UpsellModal
            data-testid="color-per-event:upsell-modal"
            modalProps={upsellModalProps}
            features={['more-storage', 'more-email-addresses', 'more-calendars', 'calendar-sharing']}
            description={c('Description')
                .t`Better organize your day, track your time, and prioritize tasks. Color-code your calendar with custom event colors.`}
            title={c('Title').t`Add some color to your day`}
            sourceEvent="BUTTON_COLOR_PER_EVENT"
            application={APPS.PROTONCALENDAR}
            headerType="calendar"
            hideInfo={isDrawerApp}
            {...upsellConfig}
        />
    );

    // Wrap the children in a div to show spotlight
    return (
        <>
            <Spotlight
                content={
                    <>
                        <div className="flex flex-nowrap items-start mb-1">
                            <div className="text-lg text-bold flex-1">{c('Spotlight').t`Custom event colors`}</div>
                            <Badge className="rounded shrink-0 text-sm ml-1" type="success">{c('Badge').t`New!`}</Badge>
                        </div>
                        <p className="m-0">{c('Spotlight')
                            .t`Color-code your calendar to better organize your day, track your time, and more.`}</p>
                    </>
                }
                show={shouldShowColorSpotlight}
                originalPlacement="right"
                onDisplayed={onDisplayed}
                isAboveModal
            >
                <div className="shrink-0">
                    <ColorPicker
                        color={color}
                        onChange={handleChangeColor}
                        displayColorName={false}
                        className="ml-2"
                        onClickColorPicker={handleClickColorPicker}
                        data-testid="event-color-picker"
                    />
                </div>
            </Spotlight>

            {renderUpsellModal && modal}
        </>
    );
};

export default EventColorSelect;
