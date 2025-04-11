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

import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import splitAssetString from "@canvas/util/splitAssetString"
import filesEnv from "../../../../shared/files_v2/react/modules/filesEnv"
import { createStubRootFolder } from "../../utils/folderUtils"
import { generateFolderByPathUrl } from "../../utils/apiUtils"
import { Folder } from "../../interfaces/File"

function getRootFolder(pluralContextType: string, contextId: string) {
  return createStubRootFolder(filesEnv.contextsDictionary[`${pluralContextType}_${contextId}`])
}

async function loadFolders(pluralContextType: string, contextId: string, path?: string) {
  const url = generateFolderByPathUrl(pluralContextType, contextId, path)
  const resp = await fetch(url)
  const folders = await resp.json()
  if (!folders || folders.length === 0) {
    throw new Error('Error fetching by_path')
  }
  return folders as Folder[]
}

export const useGetFolders = () => {
  const pathParams = useParams()
  const pathContext = pathParams.context
  const path = pathParams['*']
  const [contextType, contextId] = pathContext
    ? splitAssetString(pathContext)!
    : [filesEnv.contextType, filesEnv.contextId]

  return useQuery({
    queryKey: ['folders', pathContext, path, contextType, contextId],
    staleTime: 0,
    keepPreviousData: true,
    queryFn: async () => {
      return path
        ? await loadFolders(contextType, contextId, path)
        : [getRootFolder(contextType, contextId)]
    }
  })
}
