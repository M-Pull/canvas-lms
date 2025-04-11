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

import {Heading} from '@instructure/ui-heading'
import {Modal} from '@instructure/ui-modal'
import {useScope as createI18nScope} from '@canvas/i18n'
import React, {useEffect, useRef, useState} from 'react'
import {Button, CloseButton} from '@instructure/ui-buttons'
import {Spinner} from '@instructure/ui-spinner'
import {showFlashError} from '@canvas/alerts/react/FlashAlert'
import doFetchApi from '@canvas/do-fetch-api-effect'
import {Portal} from '@instructure/ui-portal'
import {DateTimeInput} from '@instructure/ui-date-time-input'
import {ScreenReaderContent} from '@instructure/ui-a11y-content'
import {View} from '@instructure/ui-view'

const I18n = createI18nScope('account_reports')

interface Props {
  formHTML: string
  path: string
  reportName: string
  closeModal: () => void
  onSuccess: (reportName: string) => void
  onRender: () => void
}

const getElementValue = (element: Element) => {
  let value
  const type = element.getAttribute('type')
  if (type === 'checkbox') {
    value = (element as HTMLInputElement).checked ? '1' : null
  } else {
    value = (element as HTMLInputElement).value
  }
  return value
}

const getFormData = (form: HTMLDivElement) => {
  // get all the form elements
  const formElements = form.querySelectorAll<HTMLInputElement>('input, select')
  const formArray = Array.from(formElements)
  const formData = new FormData()
  formArray.forEach(element => {
    const name = element.getAttribute('name')
      ? element.getAttribute('name')
      : element.dataset.testid
    const value = getElementValue(element)
    if (name && value !== null) {
      formData.append(name, value)
    }
  }, {})
  return formData
}

export default function ConfigureReportForm(props: Props) {
  const formRef = useRef<HTMLDivElement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [startRef, setStartRef] = useState<HTMLElement | null>(null)
  const [endRef, setEndRef] = useState<HTMLElement | null>(null)
  const [startAt, setStartAt] = useState<string>()
  const [endAt, setEndAt] = useState<string>()

  useEffect(() => {
    props.onRender()
    // testing purposes only; don't swap date pickers if in jest
    if (formRef.current && typeof $ !== 'undefined') {
      const $form = $(formRef.current)

      // Find all datetime inputs and remove the closest <tr>
      $form.find('input.datetime_field').each(function () {
        const closestTd = $(this).closest('td')[0]
        closestTd.innerHTML = ''
        if ($(this).attr('name') === 'parameters[start_at]') {
          setStartRef(closestTd)
        } else {
          setEndRef(closestTd)
        }
      })
    }
  }, [])

  const onSubmit = async () => {
    setIsLoading(true)
    if (formRef.current) {
      const formData = getFormData(formRef.current)
      if (formData.get('parameters[start_at]')) {
        formData.append('parameters[start_at]', startAt ?? '')
      }
      if (formData.get('parameters[end_at]')) {
        formData.set('parametes[end_at]', endAt ?? '')
      }
      try {
        await doFetchApi({
          path: props.path,
          body: formData,
          method: 'POST',
        })
        props.onSuccess(props.reportName)
      } catch (e) {
        showFlashError(I18n.t('Failed to start report.'))(e as Error)
        setIsLoading(false)
      }
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <Modal.Body>
          <View margin="small auto" as="div" textAlign="center">
            <Spinner renderTitle={I18n.t('Starting report')} />
          </View>
        </Modal.Body>
      )
    }
    return (
      <Modal.Body padding="medium">
        <div
          id="configure_modal_body"
          ref={formRef}
          dangerouslySetInnerHTML={{__html: props.formHTML}}
        ></div>
        <Portal open mountNode={startRef}>
          <DateTimeInput
            layout="columns"
            dateInputRef={dateInputRef => {
              dateInputRef?.setAttribute('data-testid', 'parameters[start_at]')
            }}
            onChange={(_, isoValue) => setStartAt(isoValue)}
            description={<ScreenReaderContent>{I18n.t('Start at')}</ScreenReaderContent>}
            dateRenderLabel={I18n.t('Start Date')}
            prevMonthLabel={I18n.t('Previous month')}
            nextMonthLabel={I18n.t('Next month')}
            timeRenderLabel={I18n.t('Time')}
            invalidDateTimeMessage={I18n.t('Invalid date and time.')}
          />
          <br />
        </Portal>
        <Portal open mountNode={endRef}>
          <DateTimeInput
            layout="columns"
            dateInputRef={dateInputRef => {
              dateInputRef?.setAttribute('data-testid', 'parameters[end_at]')
            }}
            onChange={(_, isoValue) => setEndAt(isoValue)}
            description={<ScreenReaderContent>{I18n.t('End at')}</ScreenReaderContent>}
            dateRenderLabel={I18n.t('End Date')}
            prevMonthLabel={I18n.t('Previous month')}
            nextMonthLabel={I18n.t('Next month')}
            timeRenderLabel={I18n.t('Time')}
            invalidDateTimeMessage={I18n.t('Invalid date and time.')}
          />
          <br />
        </Portal>
      </Modal.Body>
    )
  }
  return (
    <Modal label={I18n.t('Configure Report')} open>
      <Modal.Header>
        <Heading>{I18n.t('Configure Report')}</Heading>
        <CloseButton
          data-testid="close-button"
          placement="end"
          size="medium"
          onClick={props.closeModal}
          screenReaderLabel={I18n.t('Close')}
        />
      </Modal.Header>
      {renderContent()}
      <Modal.Footer>
        <Button data-testid="run-report" disabled={isLoading} color="primary" onClick={onSubmit}>
          {I18n.t('Run Report')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
