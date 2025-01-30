/*
 * Copyright (C) 2024 - present Instructure, Inc.
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
import {render, waitFor, screen} from '@testing-library/react'
import FilesApp from '../FilesApp'
import {MockedQueryClientProvider} from '@canvas/test-utils/query'
import {queryClient} from '@canvas/query'
import fetchMock from 'fetch-mock'
import filesEnv from '@canvas/files_v2/react/modules/filesEnv'
import {setupFilesEnv} from '../../../fixtures/fakeFilesEnv'
import {createMemoryRouter, RouterProvider} from 'react-router-dom'
import {FAKE_FOLDERS} from '../../../fixtures/fakeData'

describe('FilesApp', () => {
  beforeEach(() => {
    setupFilesEnv()
    fetchMock.get(/.*\/by_path/, [FAKE_FOLDERS[0]], {overwriteRoutes: true})
    fetchMock.get(/.*\/all.*/, [FAKE_FOLDERS[1]], {
      overwriteRoutes: true,
    })
    fetchMock.get(/.*\/files\/quota/, {quota_used: 500, quota: 1000}, {overwriteRoutes: true})
    filesEnv.userHasPermission = jest.fn().mockReturnValue(true)
  })

  afterEach(() => {
    fetchMock.resetHistory()
  })

  const renderComponent = (contextAssetString: string) => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <FilesApp contextAssetString={contextAssetString} />,
          loader: async () => {
            return [FAKE_FOLDERS[0]]
          },
        },
      ],
      {initialEntries: ['/']},
    )
    return render(
      <MockedQueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </MockedQueryClientProvider>,
    )
  }

  it('does not render progress bar without permission', async () => {
    filesEnv.userHasPermission = jest.fn().mockReturnValue(false)
    renderComponent('course_12345')

    await waitFor(() => {
      expect(fetchMock.calls()).toHaveLength(1)
      expect(fetchMock.calls()[0][0]).not.toContain('/files/quota')
    })
  })

  it('renders next page button when header', async () => {
    fetchMock.get(
      /.*\/all.*/,
      {
        body: [],
        headers: {
          Link: '</next-page>; rel="next"',
        },
      },
      {
        overwriteRoutes: true,
      },
    )
    renderComponent('course_12345')
    const nextPageButton = await screen.findByRole('button', {name: '2'})
    expect(nextPageButton).toBeInTheDocument()
  })

  it('does not render page buttons when no header', async () => {
    renderComponent('course_12345')
    // necessary to make sure table has finished loading
    // otherwise test is false positive because button would never be rendered
    const folderName = await screen.findByText(FAKE_FOLDERS[1].name)
    expect(folderName).toBeInTheDocument()
    const nextPageButton = screen.queryByRole('button', {name: '1'})
    expect(nextPageButton).not.toBeInTheDocument()
  })
})
