/** Identity prefix the live-captions agent joins the room with. */
export const STT_AGENT_PREFIX = 'SttAgent#';

export const isCaptionAgentIdentity = (identity?: string): boolean => Boolean(identity?.startsWith(STT_AGENT_PREFIX));
