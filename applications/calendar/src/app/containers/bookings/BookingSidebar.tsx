import { Scroll } from '@proton/atoms/Scroll/Scroll';

import { BookingManagement } from './BookingsPageManagement';

export const BookingSidebar = () => {
    return (
        <div className="flex flex-column w-full sm:w-custom" style={{ '--sm-w-custom': '25rem' }}>
            <div className="p-3 self-end">
                <BookingManagement.Header />
            </div>

            <Scroll className="flex-1">
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
