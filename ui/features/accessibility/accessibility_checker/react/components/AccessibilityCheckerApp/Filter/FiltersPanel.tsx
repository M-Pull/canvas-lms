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

import React, {useState, useEffect, useCallback} from 'react'
import {Text} from '@instructure/ui-text'
import {Button} from '@instructure/ui-buttons'
import {Flex} from '@instructure/ui-flex'
import {IconXLine} from '@instructure/ui-icons'
import {View} from '@instructure/ui-view'

import CanvasDateInput2 from '@canvas/datetime/react/components/DateInput2'
import {useScope as createI18nScope} from '@canvas/i18n'
import useDateTimeFormat from '@canvas/use-date-time-format-hook'

import {artifactTypeOptions, issueTypeOptions, stateOptions} from '../../../constants'
import {AppliedFilter, FilterOption, Filters} from '../../../../../shared/react/types'
import {getFilters} from '../../../utils/filter'
import FilterCheckboxGroup from './FilterCheckboxGroup'
import AppliedFilters from './AppliedFilters'
import CustomToggleGroup from './CustomToggleGroup'

const I18n = createI18nScope('accessibility_checker')

interface FiltersPanelProps {
  onFilterChange: (filters: null | Filters) => void
  appliedFilters?: AppliedFilter[]
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  onFilterChange,
  appliedFilters = [],
}: FiltersPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIssues, setSelectedIssues] = useState<FilterOption[]>([
    {label: 'all', value: 'all'},
  ])
  const [selectedArtifactType, setSelectedArtifactType] = useState<FilterOption[]>([
    {label: 'all', value: 'all'},
  ])
  const [selectedState, setSelectedState] = useState<FilterOption[]>([{label: 'all', value: 'all'}])
  const [fromDate, setFromDate] = useState<FilterOption | null>(null)
  const [toDate, setToDate] = useState<FilterOption | null>(null)
  const [filterCount, setFilterCount] = useState(0)

  const dateFormatter = useDateTimeFormat('date.formats.medium_with_weekday')

  useEffect(() => {
    const filters = getFilters(appliedFilters)
    setSelectedIssues(filters.ruleTypes || [{label: 'all', value: 'all'}])
    setSelectedArtifactType(filters.artifactTypes || [{label: 'all', value: 'all'}])
    setSelectedState(filters.workflowStates || [{label: 'all', value: 'all'}])
    setFromDate(filters.fromDate || null)
    setToDate(filters.toDate || null)
    setFilterCount(appliedFilters.length)
  }, [appliedFilters])

  const getFilterSelections = useCallback((): Filters => {
    return {
      ruleTypes: selectedIssues,
      artifactTypes: selectedArtifactType,
      workflowStates: selectedState,
      fromDate: fromDate || null,
      toDate: toDate || null,
    }
  }, [fromDate, toDate, selectedArtifactType, selectedIssues, selectedState])

  const handleReset = useCallback(() => {
    setSelectedIssues([{label: 'all', value: 'all'}])
    setSelectedArtifactType([{label: 'all', value: 'all'}])
    setSelectedState([{label: 'all', value: 'all'}])
    setFromDate(null)
    setToDate(null)
    setFilterCount(0)
    onFilterChange(null)
    setIsOpen(false)
  }, [onFilterChange])

  const handleApply = useCallback(() => {
    const filters = getFilterSelections()
    setFilterCount(appliedFilters.length)
    onFilterChange(filters)
    setIsOpen(false)
  }, [appliedFilters, onFilterChange, getFilterSelections])

  const handleDateChange = useCallback(
    (dateFieldId: 'fromDate' | 'toDate') => (date: Date | null) => {
      const setDate = dateFieldId === 'fromDate' ? setFromDate : setToDate
      if (!date) {
        setDate(null)
        return
      }
      const label = dateFieldId === 'fromDate' ? I18n.t('From') : I18n.t('To')
      setDate({label: `${label}: ${dateFormatter(date)}`, value: date.toISOString()})
    },
    [dateFormatter],
  )

  const handleToggle = useCallback(() => {
    setIsOpen(!isOpen)
    if (isOpen) {
      handleApply()
    }
  }, [isOpen, handleApply])

  return (
    <View
      as="div"
      borderColor="primary"
      borderWidth="small"
      borderRadius="medium"
      padding="x-small"
    >
      <CustomToggleGroup
        size="small"
        border={false}
        toggleLabel={isOpen ? I18n.t('Close filter controls') : I18n.t('Open filter controls')}
        summary={
          <Flex gap="small">
            <Flex.Item shouldGrow={false} shouldShrink={false}>
              <Text variant="contentImportant">{I18n.t('Filter resources')}</Text>
            </Flex.Item>
            <Flex.Item shouldGrow={true} shouldShrink={true}>
              <AppliedFilters appliedFilters={appliedFilters} setFilters={onFilterChange} />
            </Flex.Item>
            {filterCount > 0 && (
              <Flex.Item shouldGrow={false} shouldShrink={false}>
                <Button
                  data-testid="clear-filters-button"
                  size={isOpen ? 'medium' : 'small'}
                  onClick={handleReset}
                  renderIcon={<IconXLine />}
                  color="secondary"
                >
                  {I18n.t('Clear filters')}
                </Button>
              </Flex.Item>
            )}
            {isOpen && (
              <Flex.Item shouldGrow={false} shouldShrink={false}>
                <Button data-testid="apply-filters-button" onClick={handleApply} color="primary">
                  {I18n.t('Apply filters')}
                </Button>
              </Flex.Item>
            )}
          </Flex>
        }
        onToggle={handleToggle}
        expanded={isOpen}
      >
        <Flex as="div" direction="row" gap="medium" alignItems="start" padding="x-small">
          <Flex.Item>
            <View as="div" margin="none none medium none">
              <CanvasDateInput2
                placeholder={I18n.t('From')}
                width="100%"
                selectedDate={fromDate?.value ?? null}
                formatDate={dateFormatter}
                interaction="enabled"
                renderLabel={I18n.t('Last edited from')}
                onSelectedDateChange={handleDateChange('fromDate')}
              />
            </View>
            <View as="div">
              <CanvasDateInput2
                placeholder={I18n.t('To')}
                width="100%"
                selectedDate={toDate?.value ?? null}
                interaction="enabled"
                formatDate={dateFormatter}
                renderLabel={I18n.t('Last edited to')}
                onSelectedDateChange={handleDateChange('toDate')}
              />
            </View>
          </Flex.Item>
          <Flex.Item>
            <FilterCheckboxGroup
              data-testid="resource-type-checkbox-group"
              name="resource-type-checkbox-group"
              description={I18n.t('Resource type')}
              options={artifactTypeOptions}
              selected={selectedArtifactType}
              onUpdate={setSelectedArtifactType}
            />
          </Flex.Item>
          <Flex.Item>
            <FilterCheckboxGroup
              data-testid="state-checkbox-group"
              name="state-checkbox-group"
              description={I18n.t('State')}
              options={stateOptions}
              selected={selectedState}
              onUpdate={setSelectedState}
            />
          </Flex.Item>
          <Flex.Item>
            <FilterCheckboxGroup
              data-testid="issue-type-checkbox-group"
              name="issue-type-checkbox-group"
              description={I18n.t('With issues of')}
              options={issueTypeOptions}
              selected={selectedIssues}
              onUpdate={setSelectedIssues}
            />
          </Flex.Item>
        </Flex>
      </CustomToggleGroup>
    </View>
  )
}

export default FiltersPanel
