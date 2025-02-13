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
import { userEvent } from '@testing-library/user-event'
import fakeENV from '@canvas/test-utils/fakeENV'
import UserDifferentiationTagManager from '../UserDifferentiationTagManager'
import type {UserDifferentiationTagManagerProps} from '../UserDifferentiationTagManager'
import {useDifferentiationTagCategoriesIndex} from '../../hooks/useDifferentiationTagCategoriesIndex'

jest.mock('../../hooks/useDifferentiationTagCategoriesIndex')

const mockUseDifferentiationTagCategoriesIndex = useDifferentiationTagCategoriesIndex as jest.Mock

describe('UserDifferentiationTagManager', () => {
  const defaultProps: UserDifferentiationTagManagerProps = {
    courseId: 1,
    users:['1','2']
  }
  let user: ReturnType<typeof userEvent.setup>
  const renderComponent = (mockReturn = {}) => {
    const defaultMock = {
      data: [],
      isLoading: false,
      error: null,
    }
    mockUseDifferentiationTagCategoriesIndex.mockReturnValue({...defaultMock, ...mockReturn})
    render(<UserDifferentiationTagManager {...defaultProps} />)
  }

  beforeEach(() => {
    jest.clearAllMocks()
    fakeENV.setup({
      current_context: {
          id: 1,
          type:'Course',
      }
    })
    user = userEvent.setup()
  })

  it('renders the component correctly', () => {
    renderComponent()
    expect(screen.queryByTestId('user-diff-tag-manager-user-count')).toBeInTheDocument()
    expect(screen.queryByTestId('user-diff-tag-manager-tag-as-button')).toBeInTheDocument()
    expect(screen.queryByTestId('user-diff-tag-manager-manage-tags-button')).toBeInTheDocument()
    expect(screen.getByText(/2 Selected/)).toBeInTheDocument()
  })

  it('shows loading in menu when fetching categories', async () => {
    renderComponent({isLoading: true, data: null})
    const TagAsbutton = screen.getByTestId('user-diff-tag-manager-tag-as-button')
    await user.click(TagAsbutton)

    expect(screen.getByText('Fetching Categories...')).toBeInTheDocument()
  })

  it('shows error message when there is an error', async () => {
    const error = new Error('Failed to fetch')
    renderComponent({error, data: null})
    const TagAsbutton = screen.getByTestId('user-diff-tag-manager-tag-as-button')
    await user.click(TagAsbutton)

    expect(screen.getByText('Error Fetching Categories!')).toBeInTheDocument()
  })

  it('populates Tag as Menu with the mocked categories', async () => {
    const mockCategories = [
      {id: 1, name: 'Category 1', groups: []},
      {id: 2, name: 'Category 2', groups: []},
    ]
    renderComponent({data: mockCategories})
    const TagAsbutton = screen.getByTestId('user-diff-tag-manager-tag-as-button')
    await user.click(TagAsbutton)

    expect(screen.getByText('Category 1')).toBeInTheDocument()
    expect(screen.getByText('Category 2')).toBeInTheDocument()
  })

  it('renders empty message when there are not any diff tag', async () => {
    renderComponent({data: []})
    const TagAsbutton = screen.getByTestId('user-diff-tag-manager-tag-as-button')
    await user.click(TagAsbutton)

    expect(screen.getByText('No Differentiation Tag Categories Yet')).toBeInTheDocument()
  })
})
