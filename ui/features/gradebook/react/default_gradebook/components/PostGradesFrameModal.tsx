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

import React, {useMemo} from 'react'
import iframeAllowances from '@canvas/external-apps/iframeAllowances'
import {useScope as createI18nScope} from '@canvas/i18n'
import {Modal} from '@instructure/ui-modal'
import {Lti} from '../gradebook.d'
import {CloseButton} from '@instructure/ui-buttons'
import {Heading} from '@instructure/ui-heading'
import {ScreenReaderContent} from '@instructure/ui-a11y-content'

const I18n = createI18nScope('gradebook')

export type PostGradesFrameModalProps = {
  postGradesLtis: Lti[]
  selectedLtiId?: string | null
  onClose?: () => void
}

function PostGradesFrameModal({postGradesLtis, selectedLtiId, onClose}: PostGradesFrameModalProps) {
  const baseUrl = useMemo(() => {
    return postGradesLtis.filter(lti => lti.id === selectedLtiId)[0]?.data_url
  }, [postGradesLtis, selectedLtiId])

  return (
    <Modal
      as={'div'}
      label={I18n.t('Sync Grades')}
      size="large"
      open={(selectedLtiId ?? '').length > 0}
      onDismiss={onClose}
      data-testid="post-grades-frame-modal"
    >
      <Modal.Header spacing="compact">
        <Heading level="h2">{I18n.t('Sync Grades')}</Heading>
        <CloseButton
          placement="end"
          offset="small"
          onClick={onClose}
          screenReaderLabel={I18n.t('Close')}
        />
      </Modal.Header>
      <Modal.Body padding="none">
        <ScreenReaderContent>
          {I18n.t('The following content is partner provided')}
        </ScreenReaderContent>
        {baseUrl ? (
          <iframe
            src={baseUrl}
            className="post-grades-frame"
            style={{border: 'none', width: '100%', height: '75vh'}}
            title={I18n.t('Sync Grades')}
            allow={iframeAllowances()}
            data-lti-launch="true"
          />
        ) : null}
        <ScreenReaderContent>
          {I18n.t('The preceding content is partner provided')}
        </ScreenReaderContent>
      </Modal.Body>
    </Modal>
  )
}

PostGradesFrameModal.defaultProps = {}

export default PostGradesFrameModal
