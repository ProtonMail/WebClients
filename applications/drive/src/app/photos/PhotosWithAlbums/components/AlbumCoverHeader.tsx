import { fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Avatar, Button } from '@proton/atoms/index';
import { Icon } from '@proton/components/index';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { dateLocale } from '@proton/shared/lib/i18n';

import type { DecryptedAlbum } from '../../PhotosStore/PhotosWithAlbumsProvider';

export const AlbumCoverHeader = ({ album }: { album: DecryptedAlbum }) => {
    const formattedDate = new Intl.DateTimeFormat(dateLocale.code, {
        dateStyle: 'long',
    }).format(fromUnixTime(album.createTime));

    const [user] = useUser();

    const { Email, DisplayName, Name } = user;

    const nameToDisplay = DisplayName || Name || ''; // nameToDisplay can be falsy for external account
    const initials = getInitials(nameToDisplay || Email || '');

    return (
        <div className="flex shrink-0 flex-row flex-nowrap items-center p-4">
            {album.cachedThumbnailUrl || album.cover?.cachedThumbnailUrl ? (
                <img
                    src={album.cachedThumbnailUrl || album.cover?.cachedThumbnailUrl}
                    alt=""
                    className="bg-weak rounded mr-4 w-1/3 flex h-custom object-cover"
                    style={{
                        '--h-custom': '14rem',
                    }}
                />
            ) : (
                <span
                    className="bg-weak rounded mr-4 w-1/3 flex h-custom object-cover"
                    style={{
                        '--h-custom': '14rem',
                    }}
                >
                    {/* temporary until we add it as a real icon */}
                    <svg
                        className="m-auto"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M6 3V21"
                            style={{ stroke: 'var(--text-norm)' }}
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M18 3V21"
                            style={{ stroke: 'var(--text-norm)' }}
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M3 6H21"
                            style={{ stroke: 'var(--text-norm)' }}
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M3 18H21"
                            style={{ stroke: 'var(--text-norm)' }}
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </span>
            )}

            <div className="flex flex-column flex-nowrap mx-auto shrink-0 flex-1">
                <h1 className="text-bold h2">{album.name}</h1>
                <p className="color-weak mt-1">
                    {formattedDate}
                    <span className="ml-1">
                        ⋅{' '}
                        {c('Info').ngettext(
                            msgid`${album.photoCount} item`,
                            `${album.photoCount} items`,
                            album.photoCount
                        )}
                    </span>
                </p>
                <div className="flex flex-nowrap flex-row gap-2">
                    <Avatar color="weak">{initials}</Avatar>
                    {/** TO DO: connect buttons to functions */}
                    <Button
                        color="weak"
                        shape="solid"
                        size="small"
                        className="inline-flex flex-row flex-nowrap items-center"
                    >
                        <Icon name="user-plus" className="mr-2" />
                        {c('Action').t`Share`}
                    </Button>
                    <Button
                        color="norm"
                        shape="solid"
                        size="small"
                        className="inline-flex flex-row flex-nowrap items-center"
                    >
                        <Icon name="plus" className="mr-2" />
                        {c('Action').t`Add photos`}
                    </Button>
                </div>
            </div>
        </div>
    );
};
