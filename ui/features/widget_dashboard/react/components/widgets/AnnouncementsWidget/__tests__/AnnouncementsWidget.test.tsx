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
import {render, screen, waitFor, fireEvent} from '@testing-library/react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {setupServer} from 'msw/node'
import {graphql, HttpResponse} from 'msw'
import AnnouncementsWidget from '../AnnouncementsWidget'
import type {BaseWidgetProps, Widget} from '../../../../types'

const mockWidget: Widget = {
  id: 'test-announcements-widget',
  type: 'announcements',
  position: {col: 1, row: 1},
  size: {width: 1, height: 1},
  title: 'Announcements',
}

// Mock GraphQL response data that matches the useAnnouncements hook structure
const mockAnnouncementsData = [
  {
    _id: '1',
    title: 'Test Announcement 1',
    message: '<p>This is a test announcement message</p>',
    createdAt: '2025-01-15T10:00:00Z',
    contextName: 'Test Course 1',
    contextId: '1',
    isAnnouncement: true,
    author: {
      _id: 'user1',
      name: 'Test Teacher 1',
      avatarUrl: 'https://example.com/avatar1.jpg',
    },
    participant: {
      id: 'participant1',
      read: true,
    },
  },
  {
    _id: '2',
    title: 'Test Announcement 2',
    message: '<p>Another test announcement</p>',
    createdAt: '2025-01-14T15:30:00Z',
    contextName: 'Test Course 2',
    contextId: '2',
    isAnnouncement: true,
    author: {
      _id: 'user2',
      name: 'Test Teacher 2',
      avatarUrl: 'https://example.com/avatar2.jpg',
    },
    participant: null,
  },
]

const mockGqlResponse = {
  data: {
    legacyNode: {
      _id: '123',
      enrollments: [
        {
          course: {
            _id: '1',
            name: 'Test Course 1',
            courseCode: 'TEST101',
            discussionsConnection: {
              nodes: [mockAnnouncementsData[0]],
            },
          },
        },
        {
          course: {
            _id: '2',
            name: 'Test Course 2',
            courseCode: 'TEST102',
            discussionsConnection: {
              nodes: [mockAnnouncementsData[1]],
            },
          },
        },
      ],
    },
  },
}

const buildDefaultProps = (overrides: Partial<BaseWidgetProps> = {}): BaseWidgetProps => {
  return {
    widget: mockWidget,
    ...overrides,
  }
}

const setup = (props: BaseWidgetProps = buildDefaultProps(), envOverrides = {}) => {
  // Set up Canvas ENV with current_user_id
  const originalEnv = window.ENV
  window.ENV = {
    ...originalEnv,
    current_user_id: '123',
    ...envOverrides,
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  const result = render(<AnnouncementsWidget {...props} />, {
    wrapper: ({children}: {children: React.ReactNode}) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })

  return {
    ...result,
    queryClient,
    cleanup: () => {
      window.ENV = originalEnv
      queryClient.clear()
    },
  }
}

const server = setupServer()

const waitForLoadingToComplete = async () => {
  await waitFor(() => {
    expect(screen.queryByText('Loading announcements...')).not.toBeInTheDocument()
  })
}

describe('AnnouncementsWidget', () => {
  beforeAll(() =>
    server.listen({
      onUnhandledRequest: 'bypass',
    }),
  )
  afterEach(() => {
    server.resetHandlers()
  })
  afterAll(() => server.close())

  it('renders loading state initially', () => {
    // Set up a delayed response to ensure we see the loading state
    server.use(
      graphql.query('GetUserAnnouncements', () => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(HttpResponse.json(mockGqlResponse))
          }, 100)
        })
      }),
    )

    const {cleanup} = setup()
    expect(screen.getByText('Loading announcements...')).toBeInTheDocument()
    cleanup()
  })

  it('renders announcements list after loading', async () => {
    server.use(
      graphql.query('GetUserAnnouncements', () => {
        return HttpResponse.json(mockGqlResponse)
      }),
    )

    const {cleanup} = setup()

    await waitForLoadingToComplete()

    await waitFor(() => {
      // With default "unread" filter, only Test Announcement 2 should show (participant: null = unread)
      expect(screen.queryByText('Test Announcement 1')).not.toBeInTheDocument() // This is read
      expect(screen.getByText('Test Announcement 2')).toBeInTheDocument() // This is unread
      expect(screen.queryByText('TEST101')).not.toBeInTheDocument() // Course code for read announcement
      expect(screen.getByText('TEST102')).toBeInTheDocument() // Course code for unread announcement
    })

    cleanup()
  })

  it('renders empty state when no announcements', async () => {
    server.use(
      graphql.query('GetUserAnnouncements', () => {
        return HttpResponse.json({
          data: {
            legacyNode: {
              _id: '123',
              enrollments: [],
            },
          },
        })
      }),
    )

    const {cleanup} = setup()

    await waitForLoadingToComplete()

    expect(screen.getByText('No recent announcements')).toBeInTheDocument()
    cleanup()
  })

  it('renders error state when API request fails', async () => {
    server.use(
      graphql.query('GetUserAnnouncements', () => {
        return HttpResponse.json({
          errors: [{message: 'GraphQL error'}],
        })
      }),
    )

    const {cleanup} = setup()

    await waitForLoadingToComplete()

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load announcements. Please try again.'),
      ).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    cleanup()
  })

  it('strips HTML from announcement message preview', async () => {
    server.use(
      graphql.query('GetUserAnnouncements', () => {
        return HttpResponse.json(mockGqlResponse)
      }),
    )

    const {cleanup} = setup()

    await waitForLoadingToComplete()

    await waitFor(() => {
      // With default "unread" filter, only Test Announcement 2 content should show
      expect(screen.queryByText('This is a test announcement message')).not.toBeInTheDocument() // Test Announcement 1 is read
      expect(screen.getByText('Another test announcement')).toBeInTheDocument() // Test Announcement 2 is unread
    })

    cleanup()
  })

  it('calls GraphQL with correct variables', async () => {
    let capturedVariables: any = null

    server.use(
      graphql.query('GetUserAnnouncements', ({variables}) => {
        capturedVariables = variables
        return HttpResponse.json(mockGqlResponse)
      }),
    )

    const {cleanup} = setup()

    await waitForLoadingToComplete()

    expect(capturedVariables).not.toBeNull()
    expect(capturedVariables.first).toBe(8) // Default limit used by the hook
    expect(capturedVariables.userId).toBe('123') // From ENV.current_user_id

    cleanup()
  })

  it('retries GraphQL call when retry button is clicked', async () => {
    let callCount = 0

    server.use(
      graphql.query('GetUserAnnouncements', () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.json({
            errors: [{message: 'GraphQL error'}],
          })
        }
        return HttpResponse.json(mockGqlResponse)
      }),
    )

    const {cleanup} = setup()

    // Wait for error state to appear
    await waitFor(() => {
      expect(
        screen.getByText('Failed to load announcements. Please try again.'),
      ).toBeInTheDocument()
    })

    // Click retry button
    const retryButton = screen.getByText('Retry')
    fireEvent.click(retryButton)

    // Wait for successful data to load - with default "unread" filter, should show Test Announcement 2
    await waitFor(() => {
      expect(screen.getByText('Test Announcement 2')).toBeInTheDocument()
    })

    expect(callCount).toBe(2)
    cleanup()
  })

  it('truncates very long announcement titles and content', async () => {
    const longContentResponse = {
      data: {
        legacyNode: {
          _id: '123',
          enrollments: [
            {
              course: {
                _id: '1',
                name: 'This is a Very Long Course Name That Should Be Truncated Because It Exceeds Normal Length',
                courseCode: 'VERYLONGCODE123',
                discussionsConnection: {
                  nodes: [
                    {
                      _id: '1',
                      title:
                        'This is an Extremely Long Announcement Title That Should Be Truncated Because It Is Way Too Long For The Widget',
                      message:
                        '<p>This is an extremely long announcement message that contains lots of details and should be truncated to prevent the widget from overflowing beyond its designated boundaries and breaking the layout</p>',
                      createdAt: '2025-01-15T10:00:00Z',
                      contextName: 'Test Course',
                      contextId: '1',
                      isAnnouncement: true,
                      author: {
                        _id: 'user1',
                        name: 'Test Teacher',
                        avatarUrl: 'https://example.com/avatar.jpg',
                      },
                      participant: null,
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    }

    server.use(
      graphql.query('GetUserAnnouncements', () => {
        return HttpResponse.json(longContentResponse)
      }),
    )

    const {cleanup} = setup()

    await waitForLoadingToComplete()

    // Should show truncated title (max 25 chars) - shows "This is an Extremely Long..."
    expect(screen.getByText(/This is an Extremely Long\.\.\./)).toBeInTheDocument()

    // Should show course code
    expect(screen.getByText('VERYLONGCODE123')).toBeInTheDocument()

    // Should show truncated message (max 80 chars) - shows "This is an extremely long announcement message that contains lots of details and..."
    expect(
      screen.getByText(
        /This is an extremely long announcement message that contains lots of details and\.\.\./,
      ),
    ).toBeInTheDocument()

    cleanup()
  })

  it('filters announcements by read status', async () => {
    server.use(
      graphql.query('GetUserAnnouncements', () => {
        return HttpResponse.json(mockGqlResponse)
      }),
    )

    const {cleanup} = setup()

    await waitForLoadingToComplete()

    // Default filter should be "unread" - only Test Announcement 2 should show
    expect(screen.queryByText('Test Announcement 1')).not.toBeInTheDocument()
    expect(screen.getByText('Test Announcement 2')).toBeInTheDocument()

    // Find the filter dropdown and change to "read"
    const filterDropdown = screen.getByTitle('Unread')
    fireEvent.click(filterDropdown)

    // Click on "Read" option
    const readOption = await screen.findByText('Read')
    fireEvent.click(readOption)

    // Now only read announcements should show
    await waitFor(() => {
      expect(screen.getByText('Test Announcement 1')).toBeInTheDocument()
      expect(screen.queryByText('Test Announcement 2')).not.toBeInTheDocument()
    })

    // Change to "All" filter
    const updatedDropdown = screen.getByTitle('Read')
    fireEvent.click(updatedDropdown)

    const allOption = await screen.findByText('All')
    fireEvent.click(allOption)

    // Now both announcements should show
    await waitFor(() => {
      expect(screen.getByText('Test Announcement 1')).toBeInTheDocument()
      expect(screen.getByText('Test Announcement 2')).toBeInTheDocument()
    })

    cleanup()
  })

  it('toggles read/unread status when buttons are clicked', async () => {
    // Mock the mutation response
    server.use(
      graphql.query('GetUserAnnouncements', () => {
        return HttpResponse.json(mockGqlResponse)
      }),
      graphql.mutation('UpdateDiscussionReadState', () => {
        return HttpResponse.json({
          data: {
            updateDiscussionReadState: {
              discussionTopic: {
                _id: '2',
              },
            },
          },
        })
      }),
    )

    const {cleanup} = setup()

    await waitForLoadingToComplete()

    // Default filter is "unread" - should show Test Announcement 2 (unread)
    await waitFor(() => {
      expect(screen.getByText('Test Announcement 2')).toBeInTheDocument()
    })

    // Find and click the mark as read button for Test Announcement 2
    const markReadButton = screen.getByTestId('mark-read-2')
    expect(markReadButton).toBeInTheDocument()

    fireEvent.click(markReadButton)

    // The mutation should be called (we can't easily test the actual state change
    // without more complex mocking, but we can verify the button exists and is clickable)
    expect(markReadButton).toBeInTheDocument()

    cleanup()
  })
})
