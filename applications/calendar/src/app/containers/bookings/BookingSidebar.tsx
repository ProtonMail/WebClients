import { Scroll } from '@proton/atoms/Scroll/Scroll';

import { BookingManagement } from './BookingsPageManagement';

export const BookingSidebar = () => {
    return (
        <div className="w-full sm:w-custom flex flex-column" style={{ '--w-custom': '15rem' }}>
            <div className="p-3 self-end">
                <BookingManagement.Header />
            </div>

            <Scroll className="flex-1 w-full">
                <div className="px-6 py-4">
                    <BookingManagement.Form />
                </div>
            </Scroll>

            <div className="px-6 py-4">
                <BookingManagement.Buttons />
            </div>
        </div>
    );
};
