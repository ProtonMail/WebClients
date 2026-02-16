import { useMemo } from 'react';

import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account';
import { useUser } from '@proton/account/user/hooks';
import Badge from '@proton/components/components/badge/Badge';
import ColorPicker from '@proton/components/components/input/ColorPicker';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import UpsellModal from '@proton/components/components/upsell/UpsellModal/UpsellModal';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features';
import { APP_UPSELL_REF_PATH, CALENDAR_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';
import paintImg from '@proton/styles/assets/img/illustrations/new-upsells-img/paint.svg';

interface Props {
    model: EventModel;
    setModel: (value: EventModel) => void;
}

const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: CALENDAR_UPSELL_PATHS.COLOR_PER_EVENT,
});

const EventColorSelect = ({ model, setModel }: Props) => {
    const [user] = useUser();

    const {
        welcomeFlags: { isWelcomeFlow },
    } = useWelcomeFlags();
    const [upsellModalProps, setUpsellModal, renderUpsellModal] = useModalState();
    const color = useMemo(() => {
        // If free user, we always display the calendar color, otherwise we display the event color if set
        const eventColorToShow = user.hasPaidMail ? model.color : undefined;
        return eventColorToShow || model.calendar.color;
    }, [model.calendar.color, model.color, user.hasPaidMail]);
    const {
        show: showColorSpotlight,
        onDisplayed,
        onClose,
    } = useSpotlightOnFeature(FeatureCode.CalendarEventColorSpotlight, !isWelcomeFlow);
    const shouldShowColorSpotlight = useSpotlightShow(showColorSpotlight && user.hasPaidMail);

    const handleChangeColor = (color: string) => {
        setModel({ ...model, color });
    };

    const handleClickColorPicker = (toggleColorPicker: () => void) => {
        // Close the spotlight if open when clicking on the color select
        if (shouldShowColorSpotlight) {
            onClose();
        }

        if (user.hasPaidMail) {
            toggleColorPicker();
        } else {
            // If the user is free, the color picker should not be available. We open an upsell modal instead.
            setUpsellModal(true);
        }
    };

    const isIframe = getIsIframe();

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

            {renderUpsellModal && (
                <UpsellModal
                    data-testid="color-per-event:upsell-modal"
                    title={c('Title').t`Add some color to your day`}
                    description={c('Description')
                        .t`Color-code events to make it easier to organize your day, track your time, and prioritize tasks.`}
                    modalProps={upsellModalProps}
                    illustration={paintImg}
                    upsellRef={upsellRef}
                    preventInAppPayment={isIframe}
                />
            )}
        </>
    );
};

export default EventColorSelect;
