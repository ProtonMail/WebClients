import { type LumoEmojiId, getLumoEmojiName, getLumoEmojiSrc } from '../../utils/lumoEmojis/lumoEmojis';

interface Props {
    id: LumoEmojiId;
}

export const LumoEmoji = ({ id }: Props) => {
    const name = getLumoEmojiName(id);

    return (
        <img
            src={getLumoEmojiSrc(id)}
            alt={name}
            title={name}
            className="icon-size-8"
            style={{ imageRendering: 'pixelated' }}
        />
    );
};
