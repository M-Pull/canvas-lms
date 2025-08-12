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

import {useRef, useMemo, useEffect} from 'react'
import {BlockData, BlockTypes} from '../AddBlock/block-data'

export const useKeyboardNav = (
  data: BlockData[],
  selectedItem: BlockTypes,
  selectedGroup: string,
  onGroupChange: (group: BlockData) => void,
  onItemChange: (id: BlockTypes) => void,
) => {
  const focusedPositionRef = useRef<{column: number; row: number}>({column: 0, row: 0})
  const elementsRef = useRef<Map<string | number, HTMLDivElement | null>>(new Map())

  const selectedGroupItems = useMemo(
    () => data.find(group => group.groupName === selectedGroup)?.items || [],
    [data, selectedGroup],
  )

  useEffect(() => {
    for (const [key, value] of elementsRef.current.entries()) {
      if (value === null) {
        elementsRef.current.delete(key)
      }
    }
  }, [selectedGroup])

  const updateFocus = (column: number, row: number) => {
    focusedPositionRef.current = {column, row}
    elementsRef.current
      .get(column === 0 ? data[row].groupName : selectedGroupItems[row].id)
      ?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const {column, row} = focusedPositionRef.current
    event.preventDefault()
    if (event.key === 'Enter' || event.key === ' ') {
      if (column === 0) {
        onGroupChange(data[row])
      } else {
        onItemChange(selectedGroupItems[row].id)
      }
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      if (event.key === 'ArrowRight' && column === 0) {
        const newRow = selectedGroupItems.findIndex(item => item.id === selectedItem)
        updateFocus(1, newRow)
      } else if (event.key === 'ArrowLeft' && column === 1) {
        const newRow = data.findIndex(group => group.groupName === selectedGroup)
        updateFocus(0, newRow)
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const columnLength = column === 0 ? data.length : selectedGroupItems.length
      const newRow =
        event.key === 'ArrowDown' ? Math.min(row + 1, columnLength - 1) : Math.max(row - 1, 0)
      updateFocus(column, newRow)
    }
  }

  return {
    handleKeyDown,
    elementsRef,
  }
}
