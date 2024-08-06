import type { ComponentProps } from 'react'

const DividerIcon = (props: ComponentProps<'svg'>) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fill="#000"
      fillRule="evenodd"
      d="M1 8.5c0-.276.249-.5.556-.5h12.888c.307 0 .556.224.556.5s-.249.5-.556.5H1.556C1.249 9 1 8.776 1 8.5Z"
      clipRule="evenodd"
    />
  </svg>
)
export default DividerIcon
