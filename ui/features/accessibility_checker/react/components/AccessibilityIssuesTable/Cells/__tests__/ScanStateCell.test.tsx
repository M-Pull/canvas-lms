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

import {ScanStateCell} from '../ScanStateCell'
import {AccessibilityResourceScan, ResourceType, ScanWorkflowState} from '../../../../types'

describe('ScanStateCell', () => {
  describe('Unfinished Scans - ', () => {
    it('renders in progress scan state', () => {
      render(
        <ScanStateCell
          item={{workflowState: ScanWorkflowState.InProgress} as AccessibilityResourceScan}
        />,
      )
      expect(screen.getByText(/Checking/i)).toBeInTheDocument()
    })

    it('makes no distinction for queued state (renders as in progress)', () => {
      render(
        <ScanStateCell
          item={{workflowState: ScanWorkflowState.Queued} as AccessibilityResourceScan}
        />,
      )
      expect(screen.getByText(/Checking/i)).toBeInTheDocument()
    })
  })

  describe('Finished Scans, with issues - ', () => {
    const handleClick = jest.fn()

    describe('Fixable - ', () => {
      const baseItem = {
        workflowState: ScanWorkflowState.Completed,
        resourceType: ResourceType.WikiPage,
        issueCount: 5,
      } as AccessibilityResourceScan

      it('renders the correct number of issues', () => {
        render(<ScanStateCell item={baseItem} onClick={handleClick} />)
        expect(screen.getByTestId('issue-count-badge')).toHaveTextContent('5')
      })

      it('renders the correct overflow number if issueCount exceeds the visual limit', () => {
        render(<ScanStateCell item={{...baseItem, issueCount: 2000}} onClick={handleClick} />)
        expect(screen.getByTestId('issue-count-badge')).toHaveTextContent('99+')
      })

      it('renders a working fix button', () => {
        render(<ScanStateCell item={baseItem} onClick={handleClick} />)
        expect(screen.getByTestId('issue-remediation-button')).toBeInTheDocument()
        screen.getByTestId('issue-remediation-button').click()
        expect(handleClick).toHaveBeenCalledWith(expect.objectContaining(baseItem))
      })

      it('does not render a fix button, if there is no onClick specified', () => {
        render(<ScanStateCell item={baseItem} />)
        expect(screen.queryByTestId('issue-remediation-button')).not.toBeInTheDocument()
      })
    })

    describe('Unfixable - ', () => {
      const baseItem = {
        workflowState: ScanWorkflowState.Completed,
        resourceType: ResourceType.Attachment,
        issueCount: 5,
      } as AccessibilityResourceScan

      it('renders a working review button', () => {
        render(<ScanStateCell item={baseItem} onClick={handleClick} />)
        expect(screen.getByTestId('issue-review-button')).toBeInTheDocument()
        screen.getByTestId('issue-review-button').click()
        expect(handleClick).toHaveBeenCalledWith(expect.objectContaining(baseItem))
      })
    })
  })

  describe('- Finished Scans - ', () => {
    it('renders zero issues correctly', () => {
      render(
        <ScanStateCell
          item={
            {workflowState: ScanWorkflowState.Completed, issueCount: 0} as AccessibilityResourceScan
          }
        />,
      )
      expect(screen.getByText(/No issues/i)).toBeInTheDocument()
    })

    it('renders failed scan state correctly, ', () => {
      const baseFailedItem = {
        workflowState: ScanWorkflowState.Failed,
        errorMessage: 'other error',
      } as AccessibilityResourceScan

      render(<ScanStateCell item={baseFailedItem} />)
      expect(screen.getByText(/Failed/i)).toBeInTheDocument()

      const explanation = screen.getByTestId('scan-state-explanation-trigger')
      expect(explanation).toBeInTheDocument()
      explanation.focus()
      expect(explanation).toHaveTextContent(baseFailedItem.errorMessage!)
    })
  })
})
