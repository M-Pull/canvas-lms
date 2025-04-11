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

import { createContext, useContext, useState } from "react";

const ContextModule = createContext<{
  courseId: string
  isMasterCourse: boolean
  isChildCourse: boolean
  permissions: Record<string, boolean>
  state: Record<string, any>
  setState: (state: Record<string, any>) => void
}>({} as {
  courseId: string
  isMasterCourse: boolean
  isChildCourse: boolean
  permissions: Record<string, boolean>
  state: Record<string, any>
  setState: (state: Record<string, any>) => void
})

export const ContextModuleProvider = ({
  children,
  courseId,
  isMasterCourse,
  isChildCourse,
  permissions
}: {
  children: React.ReactNode
  courseId: string
  isMasterCourse: boolean
  isChildCourse: boolean
  permissions: Record<string, boolean>
}) => {
  const [state, setState] = useState({})

  return (
    <ContextModule.Provider value={{ courseId, isMasterCourse, isChildCourse, permissions, state, setState }}>
      {children}
    </ContextModule.Provider>
  );
}

export function useContextModule() {
  return useContext(ContextModule);
}
