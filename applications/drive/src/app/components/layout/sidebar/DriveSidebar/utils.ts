export const generateSidebarItemStyle = (nestingLevel: number = 0) => {
    return { marginLeft: `${(nestingLevel * 10) / 16}rem` };
};
