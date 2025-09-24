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

import {useShallow} from 'zustand/react/shallow'
import {useScope as createI18nScope} from '@canvas/i18n'
import {Flex} from '@instructure/ui-flex'
import {Spinner} from '@instructure/ui-spinner'
import {View} from '@instructure/ui-view'

import {useAccessibilityScansStore} from '../../../../shared/react/stores/AccessibilityScansStore'
import {IssuesByTypeChart} from './IssuesByTypeChart'
import {IssuesCounter} from './IssuesCounter'

const I18n = createI18nScope('accessibility_checker')

function renderLoading() {
  return (
    <View as="div" width="100%" textAlign="center" height="270px">
      <Spinner renderTitle={I18n.t('Loading accessibility issues')} size="large" margin="auto" />
    </View>
  )
}

export const AccessibilityIssuesSummary = () => {
  const [issuesSummary, loadingOfSummary] = useAccessibilityScansStore(
    useShallow(state => [state.issuesSummary, state.loadingOfSummary]),
  )

  if (window.ENV.SCAN_DISABLED === true) return null

  if (loadingOfSummary) return renderLoading()

  return (
    <Flex margin="0" gap="small" alignItems="stretch" data-testid="accessibility-issues-summary">
      <Flex.Item>
        <View as="div" padding="medium" borderWidth="small" borderRadius="medium" height="100%">
          <IssuesCounter count={issuesSummary?.total ?? 0} />
        </View>
      </Flex.Item>
      <Flex.Item shouldGrow shouldShrink>
        <View as="div" padding="x-small" borderWidth="small" borderRadius="medium" height="100%">
          <IssuesByTypeChart />
        </View>
      </Flex.Item>
    </Flex>
  )
}
