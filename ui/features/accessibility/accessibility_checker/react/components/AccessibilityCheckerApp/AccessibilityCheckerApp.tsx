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

import {useCallback, useMemo, useEffect} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {View} from '@instructure/ui-view'

import {useAccessibilityScansFetchUtils} from '../../../../shared/react/hooks/useAccessibilityScansFetchUtils'
import {useAccessibilityScansStore} from '../../../../shared/react/stores/AccessibilityScansStore'
import {AccessibilityResourceScan, ParsedFilters} from '../../../../shared/react/types'
import {parseFetchParams} from '../../../../shared/react/utils/query'
import {AccessibilityIssuesSummary} from '../AccessibilityIssuesSummary/AccessibilityIssuesSummary'
import {AccessibilityIssuesTable} from '../AccessibilityIssuesTable/AccessibilityIssuesTable'
import {SearchIssue} from './Search/SearchIssue'
import {useDeepCompareEffect} from './useDeepCompareEffect'
import {AccessibilityCheckerHeader} from './AccessibilityCheckerHeader'
import {getUnparsedFilters} from '../../../../shared/react/utils/apiData'
import {FiltersPanel} from './Filter'
import {getAppliedFilters} from '../../utils/filter'
import {useAccessibilityIssueSelect} from '../../../../shared/react/hooks/useAccessibilityIssueSelect'

export const AccessibilityCheckerApp: React.FC = () => {
  const {selectIssue} = useAccessibilityIssueSelect()

  const {doFetchAccessibilityScanData, doFetchAccessibilityIssuesSummary} =
    useAccessibilityScansFetchUtils()

  const [filters] = useAccessibilityScansStore(useShallow(state => [state.filters]))

  const [setFilters, setLoading, setSearch] = useAccessibilityScansStore(
    useShallow(state => [state.setFilters, state.setLoading, state.setSearch]),
  )

  const appliedFilters = useMemo(() => getAppliedFilters(filters || {}), [filters])

  const accessibilityScanDisabled = window.ENV.SCAN_DISABLED

  useEffect(() => {
    const parsedFetchParams = parseFetchParams()
    if (parsedFetchParams.filters && !filters) {
      setFilters(getUnparsedFilters(parsedFetchParams.filters as ParsedFilters))
    }
  }, [])

  useDeepCompareEffect(() => {
    const fetchParams = parseFetchParams()
    if (fetchParams.filters && !filters) return // wait for filters to be set from query params

    if (!accessibilityScanDisabled) {
      const parsedFetchParams = {...fetchParams, filters}
      doFetchAccessibilityScanData(parsedFetchParams)
      doFetchAccessibilityIssuesSummary(parsedFetchParams)
    } else {
      setLoading(false)
    }
  }, [accessibilityScanDisabled, setLoading, filters])

  const handleRowClick = useCallback(
    (item: AccessibilityResourceScan) => {
      selectIssue(item, true)
    },
    [selectIssue],
  )

  const handleSearchChange = useCallback(
    async (value: string) => {
      const newSearch = value
      setSearch(newSearch)
      if (newSearch.length >= 0) {
        const params = {...parseFetchParams(), search: newSearch, filters}
        await Promise.all([
          doFetchAccessibilityIssuesSummary(params),
          doFetchAccessibilityScanData(params),
        ])
      }
    },
    [setSearch, doFetchAccessibilityScanData, doFetchAccessibilityIssuesSummary, filters],
  )

  return (
    <View as="div" data-testid="accessibility-checker-app">
      <AccessibilityCheckerHeader />
      <View as="div" margin="medium 0">
        <SearchIssue onSearchChange={handleSearchChange} />
      </View>
      <FiltersPanel appliedFilters={appliedFilters} onFilterChange={setFilters} />
      <View as="div" margin={appliedFilters.length === 0 ? 'medium 0' : 'small 0'}>
        <AccessibilityIssuesSummary />
      </View>
      <AccessibilityIssuesTable onRowClick={handleRowClick} />
    </View>
  )
}
