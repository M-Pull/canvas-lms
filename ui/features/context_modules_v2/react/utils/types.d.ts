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

export interface MasteryPathsData {
  isCyoeAble: boolean
  isTrigger: boolean
  isReleased: boolean
  releasedLabel: string | null
}

export type ModuleItemContent = {
  id?: string
  _id?: string
  title: string
  type?: string
  pointsPossible?: number
  published?: boolean
  canUnpublish?: boolean
  canDuplicate?: boolean
  dueAt?: string
  lockAt?: string
  unlockAt?: string
  todoDate?: string
  url?: string
  isLockedByMasterCourse?: boolean
  assignmentGroupId?: string
  submissionTypes?: string[]
  discussionType?: string
  displayName?: string
  contentType?: string
  size?: string
  thumbnailUrl?: string
  externalUrl?: string
  newTab?: boolean
  fileState?: string
  locked?: boolean
} | null

export interface CompletionRequirement {
  id: string
  type: string
  minScore?: number
  minPercentage?: number
  completed?: boolean
  fulfillmentStatus?: string
}

export interface Prerequisite {
  id: string
  type: string
  name: string
}

export interface Module {
  id: string
  _id: string
  name: string
  position: number
  published: boolean
  prerequisites: Prerequisite[]
  completionRequirements: CompletionRequirement[]
  requirementCount: number
  requireSequentialProgress: boolean
  unlockAt: string | null
  moduleItems: ModuleItem[]
}

export interface ModulesResponse {
  modules: Module[]
  pageInfo: {
    hasNextPage: boolean
    endCursor: string | null
  }
}

interface GraphQLResult {
  legacyNode?: {
    modulesConnection?: {
      edges: Array<{
        cursor: string
        node: Module
      }>
      pageInfo: {
        hasNextPage: boolean
        endCursor: string | null
      }
    }
  }
  errors?: Array<{
    message: string
    [key: string]: any
  }>
}

export interface ModuleItemsResponse {
  moduleItems: ModuleItem[]
}

interface ModuleItemsGraphQLResult {
  legacyNode?: {
    moduleItems?: ModuleItem[]
  }
  errors?: Array<{
    message: string
    [key: string]: any
  }>
}

export interface ModuleItem {
  id: string
  _id: string
  url: string
  indent: number
  content: ModuleItemContent
}

export type ModuleAction = 'move_module' | 'move_module_item' | 'move_module_contents'

export interface Folder {
  _id: string
  canUpload: boolean
  fullName: string
  id: string
  name: string
}
