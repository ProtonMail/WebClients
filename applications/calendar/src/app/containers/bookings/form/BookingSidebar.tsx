import { Scroll } from '@proton/atoms/Scroll/Scroll';

import { BookingManagement } from './BookingsPageManagement';

import './BookingSidebar.scss';

export const BookingSidebar = () => {
    return (
        <div
            className="booking-sidebar-container ui-standard bg-lowered flex flex-column w-full sm:w-custom border-right border-weak"
            style={{ '--sm-w-custom': '25.5rem' }}
        >
            <div className="p-3 self-end">
                <BookingManagement.Header />
            </div>

            <Scroll className="flex-1 w-full">
                <div className="px-6 py-4">
                    <BookingManagement.Form />
                </div>
            </Scroll>

            <div className="p-6">
                <BookingManagement.Buttons />
            </div>
        </div>
    );
};
