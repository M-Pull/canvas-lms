/*
 * Copyright (C) 2025 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {render, screen} from '@testing-library/react'
import SelfUnenrollmentModal from '../SelfUnenrollmentModal'
import userEvent from '@testing-library/user-event'
import fetchMock from 'fetch-mock'

describe('SelfUnenrollmentModal', () => {
  const UNENROLLMENT_API_URL =
    '/courses/1/self_unenrollment/cqwYiUaQWrfmrUenN6UXQlIyhqcWDFiowYAdeP59'
  const onClose = jest.fn()

  beforeEach(() => {
    fetchMock.post(UNENROLLMENT_API_URL, 200)
  })

  afterEach(() => {
    fetchMock.restore()
  })

  it('shows the a success message and reloads the page on successful unenrollment', async () => {
    render(<SelfUnenrollmentModal unenrollmentApiUrl={UNENROLLMENT_API_URL} onClose={onClose} />)
    const dropThisCourseButton = screen.getByText('Drop this course').closest('button')

    await userEvent.click(dropThisCourseButton!)

    const successMessages = await screen.findAllByText('You have been unenrolled from the course.')
    const visualAndScreenReaderMessagesCount = 2
    expect(successMessages).toHaveLength(visualAndScreenReaderMessagesCount)
  })

  it('shows an error message when unenrollment fails', async () => {
    fetchMock.post(UNENROLLMENT_API_URL, 500, {overwriteRoutes: true})

    render(<SelfUnenrollmentModal unenrollmentApiUrl={UNENROLLMENT_API_URL} onClose={onClose} />)
    const dropThisCourseButton = screen.getByText('Drop this course').closest('button')

    await userEvent.click(dropThisCourseButton!)

    const errorMessages = await screen.findAllByText(
      'There was an error unenrolling from the course. Please try again.',
    )
    const visualAndScreenReaderMessagesCount = 2
    expect(errorMessages).toHaveLength(visualAndScreenReaderMessagesCount)
  })
})
