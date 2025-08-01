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
import {render, fireEvent, waitFor} from '@testing-library/react'
import {ContextModuleProvider, contextModuleDefaultProps} from '../../hooks/useModuleContext'
import type {ModuleItemContent} from '../../utils/types'
import {format} from '@instructure/moment-utils'
import DueDateLabel from '../DueDateLabel'

const currentDate = new Date().toISOString()
const defaultContent: ModuleItemContent = {
  id: '19',
  dueAt: currentDate,
  pointsPossible: 100,
}

const contentWithManyDueDates: ModuleItemContent = {
  ...defaultContent,
  assignmentOverrides: {
    edges: [
      {
        cursor: 'cursor',
        node: {
          set: {
            students: [
              {
                id: 'student_id_1',
              },
            ],
          },
          dueAt: new Date().addDays(-1).toISOString(), // # yesterday
        },
      },
      {
        cursor: 'cursor_2',
        node: {
          set: {
            sectionId: 'section_id',
          },
          dueAt: new Date().addDays(1).toISOString(), // # tomorrow
        },
      },
    ],
  },
}

const contentWithRedundantDueDates: ModuleItemContent = {
  ...defaultContent,
  assignmentOverrides: {
    edges: [
      {
        cursor: 'cursor',
        node: {
          set: {
            students: [
              {
                id: 'student_id_1',
              },
            ],
          },
          dueAt: currentDate,
        },
      },
    ],
  },
}

const gradedDiscussionWithAssignmentOverrides: ModuleItemContent = {
  id: '1',
  _id: '1',
  type: 'Discussion',
  graded: true,
  dueAt: '2024-01-15T23:59:59Z',
  assignment: {
    _id: 'assignment-1',
    dueAt: '2024-01-15T23:59:59Z', // Base due date for everyone
    assignmentOverrides: {
      edges: [
        {
          cursor: 'MQ',
          node: {
            dueAt: '2024-01-16T23:59:59Z',
            set: {sectionId: '1'},
          },
        },
        {
          cursor: 'Mg',
          node: {
            dueAt: '2024-01-17T23:59:59Z',
            set: {sectionId: '2'},
          },
        },
      ],
    },
  },
}

const gradedDiscussionWithAssignmentBaseDuePlusOverride: ModuleItemContent = {
  id: '2',
  _id: '2',
  type: 'Discussion',
  graded: true,
  assignment: {
    _id: 'assignment-2',
    dueAt: '2024-01-15T23:59:59Z', // Base due date for everyone (different from override)
    assignmentOverrides: {
      edges: [
        {
          cursor: 'MQ',
          node: {
            dueAt: '2024-01-16T23:59:59Z', // Different due date for one student
            set: {
              students: [{id: '123'}],
            },
          },
        },
      ],
    },
  },
}

const assignmentWithBaseDueDateAndStudentOverride: ModuleItemContent = {
  id: '1',
  _id: '1',
  type: 'Assignment',
  graded: true,
  dueAt: '2024-01-15T23:59:59Z', // Base due date for everyone
  assignmentOverrides: {
    edges: [
      {
        cursor: 'MQ',
        node: {
          dueAt: '2024-01-16T23:59:59Z', // Different due date for one student
          set: {
            students: [{id: '123'}],
          },
        },
      },
    ],
  },
}

const assignmentWithSameDueDateInOverride: ModuleItemContent = {
  id: '2',
  _id: '2',
  type: 'Assignment',
  graded: true,
  dueAt: '2024-01-15T23:59:59Z', // Base due date for everyone
  assignmentOverrides: {
    edges: [
      {
        cursor: 'MQ',
        node: {
          dueAt: '2024-01-15T23:59:59Z', // Same due date for one student (redundant)
          set: {
            students: [{id: '123'}],
          },
        },
      },
    ],
  },
}

const setUp = (content: ModuleItemContent = defaultContent) => {
  return render(
    <ContextModuleProvider {...contextModuleDefaultProps}>
      <DueDateLabel content={content} contentTagId="19" />
    </ContextModuleProvider>,
  )
}

describe('DueDateLabel', () => {
  describe('with single due date', () => {
    it('renders', () => {
      const container = setUp()
      expect(container.container).toBeInTheDocument()
      expect(container.getByTestId('due-date')).toBeInTheDocument()
    })
  })
  describe('with multiple due dates', () => {
    it('renders', () => {
      const container = setUp(contentWithManyDueDates)
      expect(container.container).toBeInTheDocument()
      expect(container.getByText('Multiple Due Dates')).toBeInTheDocument()
    })

    it('shows tooltip with details upon hover', async () => {
      const container = setUp(contentWithManyDueDates)
      const dueAtFormat = '%b %-d at %l:%M%P'
      const dueDate1 = format(
        contentWithManyDueDates.assignmentOverrides?.edges?.[0].node.dueAt,
        dueAtFormat,
      ) as string
      const dueDate2 = format(
        contentWithManyDueDates.assignmentOverrides?.edges?.[1].node.dueAt,
        dueAtFormat,
      ) as string

      fireEvent.mouseOver(container.getByText('Multiple Due Dates'))

      await waitFor(() => container.getByTestId('override-details'))

      expect(container.getByTestId('override-details')).toHaveTextContent('1 student')
      expect(container.getByTestId('override-details').textContent).toContain(dueDate1)
      expect(container.getByTestId('override-details')).toHaveTextContent('1 section')
      expect(container.getByTestId('override-details').textContent).toContain(dueDate2)
    })

    it('shows a single date when overrides are redundant', () => {
      const container = setUp(contentWithRedundantDueDates)
      expect(container.container).toBeInTheDocument()
      expect(container.getByTestId('due-date')).toBeInTheDocument()
    })
  })

  describe('with discussion types', () => {
    it('shows multiple due dates for graded discussion with assignment overrides', () => {
      const container = setUp(gradedDiscussionWithAssignmentOverrides)
      expect(container.container).toBeInTheDocument()
      expect(container.getByText('Multiple Due Dates')).toBeInTheDocument()
      // Should show "Multiple Due Dates" link for discussions with assignment-level overrides
      expect(container.queryByText('Multiple Due Dates')).toBeInTheDocument()
    })

    it('shows multiple due dates for graded discussion with assignment base due date plus override', () => {
      const container = setUp(gradedDiscussionWithAssignmentBaseDuePlusOverride)
      expect(container.container).toBeInTheDocument()
      expect(container.getByText('Multiple Due Dates')).toBeInTheDocument()
      // Should show "Multiple Due Dates" when discussion has assignment base due date + student override
      expect(container.queryByText('Multiple Due Dates')).toBeInTheDocument()
    })

    it('shows multiple due dates for assignment with base due date and student override', () => {
      const container = setUp(assignmentWithBaseDueDateAndStudentOverride)
      expect(container.container).toBeInTheDocument()
      expect(container.getByText('Multiple Due Dates')).toBeInTheDocument()
      // Should show "Multiple Due Dates" when there's a base due date + individual student override
      expect(container.queryByText('Multiple Due Dates')).toBeInTheDocument()
    })

    it('shows single date when base due date and override are the same', () => {
      const container = setUp(assignmentWithSameDueDateInOverride)
      expect(container.container).toBeInTheDocument()
      expect(container.getByTestId('due-date')).toBeInTheDocument()
      expect(container.queryByText('Multiple Due Dates')).not.toBeInTheDocument()
    })
  })
})
