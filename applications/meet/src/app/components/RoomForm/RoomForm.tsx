import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { IcTextAlignLeft } from '@proton/icons/icons/IcTextAlignLeft';
import clsx from '@proton/utils/clsx';

import './RoomForm.scss';

export type RoomVariant = 'orange' | 'blue' | 'green' | 'red';

export interface RoomFormProps {
    id?: string;
    variant: RoomVariant;
    onSubmit: ({ name }: { name: string }) => Promise<void>;
    initialName?: string;
    onClose: () => void;
}
const RoomColorsMap: Record<RoomVariant, string[]> = {
    orange: ['#523A2E', '#FFB35F', '#FF7A00'],
    blue: ['#094A62', '#7BDCFF', '#0080A8'],
    green: ['#2B3E40', '#9EEA9F', '#1CBB1D'],
    red: ['#3D2A30', '#FF8A8A', '#FC6464'],
};

const RoomIcon = ({ variant }: { variant: RoomVariant }) => (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask
            id="mask0_9763_411"
            style={{ maskType: 'alpha' }}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="70"
            height="70"
        >
            <rect width="70" height="70" rx="15.1107" fill="url(#paint0_linear_9763_411)" />
        </mask>
        <g mask="url(#mask0_9763_411)">
            <rect
                x="-8.61987"
                y="-2.66016"
                width="87.2401"
                height="87.2401"
                rx="15.1107"
                fill={RoomColorsMap[variant][0]}
            />
            <path
                d="M10.8477 47.6582C18.2313 47.6584 24.2166 53.6437 24.2168 61.0273C24.2168 64.0508 23.2137 66.8404 21.5215 69.0801L12.6982 83.2744C11.8234 84.6818 9.77464 84.6808 8.90137 83.2725L-0.898438 67.4639C-0.994413 67.3091 -1.0697 67.1499 -1.12402 66.9883C-2.01928 65.1937 -2.52246 63.1691 -2.52246 61.0273C-2.5223 53.6436 3.46384 47.6582 10.8477 47.6582ZM57.9941 47.6582C65.378 47.6582 71.3641 53.6436 71.3643 61.0273C71.3643 64.0509 70.3603 66.8403 68.668 69.0801L59.8447 83.2744C58.9698 84.6818 56.921 84.6809 56.0479 83.2725L46.248 67.4639C46.1522 67.3092 46.0777 67.1498 46.0234 66.9883C45.1282 65.1937 44.625 63.1691 44.625 61.0273C44.6252 53.6436 50.6104 47.6583 57.9941 47.6582ZM10.8232 29.9785C15.3141 29.9785 18.9551 33.6195 18.9551 38.1104C18.9549 42.601 15.314 46.2412 10.8232 46.2412C6.33257 46.2411 2.6926 42.601 2.69238 38.1104C2.69238 33.6195 6.33244 29.9786 10.8232 29.9785ZM57.9707 29.9785C62.4614 29.9787 66.1016 33.6196 66.1016 38.1104C66.1013 42.6009 62.4613 46.241 57.9707 46.2412C53.48 46.2412 49.8391 42.601 49.8389 38.1104C49.8389 33.6195 53.4798 29.9785 57.9707 29.9785Z"
                fill={RoomColorsMap[variant][1]}
            />
            <path
                d="M10.8477 47.6582C18.2313 47.6584 24.2166 53.6437 24.2168 61.0273C24.2168 64.0508 23.2137 66.8404 21.5215 69.0801L12.6982 83.2744C11.8234 84.6818 9.77464 84.6808 8.90137 83.2725L-0.898438 67.4639C-0.994413 67.3091 -1.0697 67.1499 -1.12402 66.9883C-2.01928 65.1937 -2.52246 63.1691 -2.52246 61.0273C-2.5223 53.6436 3.46384 47.6582 10.8477 47.6582ZM57.9941 47.6582C65.378 47.6582 71.3641 53.6436 71.3643 61.0273C71.3643 64.0509 70.3603 66.8403 68.668 69.0801L59.8447 83.2744C58.9698 84.6818 56.921 84.6809 56.0479 83.2725L46.248 67.4639C46.1522 67.3092 46.0777 67.1498 46.0234 66.9883C45.1282 65.1937 44.625 63.1691 44.625 61.0273C44.6252 53.6436 50.6104 47.6583 57.9941 47.6582ZM10.8232 29.9785C15.3141 29.9785 18.9551 33.6195 18.9551 38.1104C18.9549 42.601 15.314 46.2412 10.8232 46.2412C6.33257 46.2411 2.6926 42.601 2.69238 38.1104C2.69238 33.6195 6.33244 29.9786 10.8232 29.9785ZM57.9707 29.9785C62.4614 29.9787 66.1016 33.6196 66.1016 38.1104C66.1013 42.6009 62.4613 46.241 57.9707 46.2412C53.48 46.2412 49.8391 42.601 49.8389 38.1104C49.8389 33.6195 53.4798 29.9785 57.9707 29.9785Z"
                fill={RoomColorsMap[variant][2]}
            />
            <path
                d="M51.2287 77.9422C53.8934 74.4157 55.4737 70.024 55.4737 65.2633C55.4737 53.637 46.0487 44.212 34.4224 44.212C22.7961 44.212 13.3711 53.637 13.3711 65.2633C13.3711 68.6356 14.1641 71.8228 15.5737 74.6484C15.6593 74.9028 15.7764 75.154 15.9276 75.3978L31.3582 100.288C32.7331 102.506 35.9591 102.508 37.3366 100.292L51.2287 77.9422Z"
                fill={RoomColorsMap[variant][1]}
            />
            <path
                d="M47.188 29.1783C47.188 36.2494 41.4558 41.9816 34.3847 41.9816C27.3137 41.9816 21.5814 36.2494 21.5814 29.1783C21.5814 22.1072 27.3137 16.375 34.3847 16.375C41.4558 16.375 47.188 22.1072 47.188 29.1783Z"
                fill={RoomColorsMap[variant][1]}
            />
        </g>
        <defs>
            <linearGradient id="paint0_linear_9763_411" x1="0" y1="35" x2="70" y2="35" gradientUnits="userSpaceOnUse">
                <stop stopColor={RoomColorsMap[variant][0]} />
                <stop offset="1" stopColor="#6D4AFF" />
            </linearGradient>
        </defs>
    </svg>
);

export const RoomForm = ({ id, variant, onSubmit, initialName, onClose }: RoomFormProps) => {
    const [roomName, setRoomName] = useState<string>(initialName ?? '');
    const [loading, setLoading] = useState(false);
    const editMode = !!id;

    const handleSubmit = async () => {
        setLoading(true);
        // Let the callback provider handle the errors
        void onSubmit({ name: roomName }).finally(() => setLoading(false));
    };

    return (
        <div
            className={clsx('room-form flex flex-column items-center w-full md:w-custom', `variant-${variant}`)}
            style={{ '--md-w-custom': '33rem' }}
        >
            <RoomIcon variant={variant} />
            <div className="flex flex-column items-center gap-3 py-10 w-full">
                <h2 className="title h2 text-semibold w-full text-center">
                    {editMode ? roomName : c('meet').t`Create new room`}
                </h2>
                <p className="subtitle color-weak m-0">{c('meet').t`Meeting rooms can be used at any time`}</p>
            </div>
            <div className="flex self-stretch items-center gap-4 my-4">
                <IcTextAlignLeft size={5} className="color-hint" />
                <Input
                    placeholder={c('Placeholder').t`e.g., Design Team, Weekly Standup`}
                    className="input-name rounded-full px-4 py-2"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    autoFocus
                />
            </div>
            <div className="room-form-buttons flex flex-column sm:flex-row w-full gap-4">
                <Button className="cancel-button rounded-full text-semibold" onClick={() => onClose()} pill>
                    {c('Action').t`Cancel`}
                </Button>
                <Button
                    className="input-submit text-semibold"
                    onClick={handleSubmit}
                    disabled={!roomName.trim() || loading}
                    loading={loading}
                    pill
                >
                    {editMode ? c('meet').t`Save and copy link` : c('meet').t`Create and copy link`}
                </Button>
            </div>
        </div>
    );
};
