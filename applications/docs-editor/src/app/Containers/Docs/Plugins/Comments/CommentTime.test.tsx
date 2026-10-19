import { render, screen } from '@testing-library/react'
import { CommentTime } from './CommentTime'

describe('CommentTime', () => {
  it("shows a comment an hour old or more in the account's date format", () => {
    const createdAt = new Date(2024, 0, 2, 15, 4)
    render(
      <CommentTime
        createTime={{ serverTimestamp: Math.round(createdAt.getTime() / 1000) }}
        languageCode="en"
        dateFormat={{ localeCode: 'en-US', hourCycle: 'h23' }}
      />,
    )
    const time = screen.getByText('Jan 2, 2024, 15:04')
    expect(time.tagName).toBe('TIME')
    expect(time).toHaveAttribute('dateTime', createdAt.toISOString())
  })
})
