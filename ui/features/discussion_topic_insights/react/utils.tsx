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
import {IconCompleteSolid, IconTroubleSolid, IconWarningSolid} from '@instructure/ui-icons'
import {canvas} from '@instructure/ui-theme-tokens'

const honeyInstUI10 = '#B07E00'

export const getStatusByRelevance = (relevance: string, confidence: number) => {
  if (confidence < 4) {
    return <IconWarningSolid style={{fill: honeyInstUI10}} />
  } else {
    if (relevance === 'relevant') {
      return <IconCompleteSolid style={{fill: canvas.colors.shamrock}} />
    } else {
      return <IconTroubleSolid style={{fill: canvas.colors.crimson}} />
    }
  }
}

export const formatDate = (date: Date) => {
  const locale = ENV?.LOCALES?.[0] ?? 'en-US'
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })
}
