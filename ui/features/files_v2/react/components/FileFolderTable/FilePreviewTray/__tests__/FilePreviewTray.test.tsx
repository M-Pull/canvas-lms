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

import React from 'react'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {FilePreviewTray, FilePreviewTrayProps} from '../FilePreviewTray'
import type {File} from '../../../../../interfaces/File.ts'
import {MockedQueryClientProvider} from '@canvas/test-utils/query'
import {queryClient} from '@canvas/query'
import {FAKE_MEDIA_TRACKS} from './fixtures'

const defaultProps: FilePreviewTrayProps = {
  item: {
    id: '1',
    name: 'Sample File',
    type: 'document',
    restricted_by_master_course: false,
  } as unknown as File,
  onDismiss: jest.fn(),
  mediaTracks: [],
  isFetchingTracks: false,
  canAddTracks: false,
}

const renderComponent = (props?: Partial<FilePreviewTrayProps>) => {
  return render(
    <MockedQueryClientProvider client={queryClient}>
      <FilePreviewTray {...defaultProps} {...props} />
    </MockedQueryClientProvider>,
  )
}

describe('FilePreviewTray', () => {
  it('closes on click', async () => {
    renderComponent()
    const button = screen
      .getByTestId('tray-close-button')
      .querySelector('button') as HTMLButtonElement
    await userEvent.click(button)
    expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders CommonFileInfo', () => {
    renderComponent()
    expect(screen.getByText('File Info')).toBeInTheDocument()
  })

  it('renders MediaFileInfo when there are tracks', () => {
    renderComponent({
      canAddTracks: true,
      mediaTracks: FAKE_MEDIA_TRACKS,
    })
    expect(screen.getByText('Media Options')).toBeInTheDocument()
  })

  it('renders loading icon when fetching tracks', () => {
    renderComponent({
      isFetchingTracks: true,
    })
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('does not render MediaFileInfo when there are no tracks', () => {
    renderComponent()
    expect(screen.queryByText('Media Options')).not.toBeInTheDocument()
  })

  it('does not render MediaFileInfo when file is a locked blueprint item in a child course', () => {
    renderComponent({
      canAddTracks: true,
      item: {
        ...defaultProps.item,
        restricted_by_master_course: true,
        is_master_course_child_content: true,
      },
      mediaTracks: FAKE_MEDIA_TRACKS,
    })
    expect(screen.queryByText('Media Options')).not.toBeInTheDocument()
  })

  it('does not render MediaFileInfo when user cannot add tracks', () => {
    renderComponent({
      canAddTracks: false,
      mediaTracks: FAKE_MEDIA_TRACKS,
    })
    expect(screen.queryByText('Media Options')).not.toBeInTheDocument()
  })

  it('does render MediaFileInfo when file is a locked blueprint item in a parent course', () => {
    renderComponent({
      canAddTracks: true,
      item: {
        ...defaultProps.item,
        restricted_by_master_course: true,
        is_master_course_child_content: false,
      },
      mediaTracks: FAKE_MEDIA_TRACKS,
    })
    expect(screen.getByText('Media Options')).toBeInTheDocument()
  })
})
