import { Scroll } from '@proton/atoms/Scroll/Scroll';

import { BookingManagement } from './BookingsPageManagement';

import './BookingSidebar.scss';

export const BookingSidebar = () => {
    return (
        <div
            className="booking-sidebar-container ui-standard bg-lowered flex flex-column w-full sm:w-custom border-right border-weak"
            style={{ '--sm-w-custom': '25.5rem' }}
        >
            <div className="self-end bg-norm mt-4 mr-4 absolute rounded-full ">
                <BookingManagement.Header />
            </div>

            <Scroll className="flex-1 w-full">
                <div className="mt-8 px-6 py-4">
                    <BookingManagement.Form />
                </div>
            </Scroll>

            <div className="p-6">
                <BookingManagement.Buttons />
            </div>
        </div>
    );
};
