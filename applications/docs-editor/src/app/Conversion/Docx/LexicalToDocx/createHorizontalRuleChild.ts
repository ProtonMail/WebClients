import { BorderStyle, Paragraph } from 'docx'

export const createHorizontalRuleChild = async () => {
  const paragraph = new Paragraph({
    text: '',
    border: {
      top: {
        color: 'auto',
        size: 6,
        style: BorderStyle.SINGLE,
        space: 1,
      },
    },
  })
  return Promise.resolve([paragraph])
}
