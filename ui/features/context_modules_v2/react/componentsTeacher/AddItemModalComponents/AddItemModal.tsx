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

import React, {useState, useEffect, useMemo, useRef} from 'react'
import {Modal} from '@instructure/ui-modal'
import {useScope as createI18nScope} from '@canvas/i18n'
import {Button, CloseButton} from '@instructure/ui-buttons'
import {Heading} from '@instructure/ui-heading'
import {View} from '@instructure/ui-view'
import {SimpleSelect} from '@instructure/ui-simple-select'
import {TextInput} from '@instructure/ui-text-input'
import {Text} from '@instructure/ui-text'
import {FormFieldGroup} from '@instructure/ui-form-field'
import {useModuleItemContent, ModuleItemContentType} from '../../hooks/queries/useModuleItemContent'
import {useContextModule} from '../../hooks/useModuleContext'
import doFetchApi from '../../../../../shared/do-fetch-api-effect'
import { queryClient } from '../../../../../shared/query'
import AddItemTypeSelector from './AddItemTypeSelector'
import { ScreenReaderContent } from '@instructure/ui-a11y-content'

const I18n = createI18nScope('context_modules_v2')

interface AddItemModalProps {
  isOpen: boolean
  onRequestClose: () => void
  moduleName: string
  moduleId: string
  itemCount: number
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onRequestClose,
  moduleName,
  moduleId,
  itemCount
}) => {
  const [itemType, setItemType] = useState<ModuleItemContentType>('assignment')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [indentation, setIndentation] = useState<number>(0)
  const [textHeaderValue, setTextHeaderValue] = useState<string>('')
  const [externalUrlValue, setExternalUrlValue] = useState<string>('')
  const [externalUrlName, setExternalUrlName] = useState<string>('')

  const [inputValue, setInputValue] = useState('')
  const [searchText, setSearchText] = useState<string>('')
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>('')

  const { courseId } = useContextModule()

  const { data, isLoading: isLoadingContent, isError } = useModuleItemContent(
    itemType,
    courseId,
    debouncedSearchText,
    isOpen && itemType !== 'context_module_sub_header' && itemType !== 'external_url'
  )

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedSearchText(searchText)
    }, 500)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [searchText])

  const handleSubmit = () => {
    /* sample itemData, submitted as form data:
      Sample 1:

      item[type]: assignment
      item[id]: 110991
      item[title]: Module 1 - Assignment - Alpha
      item[indent]: 0
      quiz_lti: false
      content_details[]: items
      item[position]: 1
      id: new
      type: assignment
      title: Module 1 - Assignment - Alpha
      new_tab: 0
      graded: 0
      _method: POST

      Sample 2:
      item[type]: context_module_sub_header
      item[indent]: 0
      item[title]: OLDER QUIZZES
      content_details[]: items
      item[position]: 2
      id: new
      type: context_module_sub_header
      title: OLDER QUIZZES
      new_tab: 0
      graded: 0
      _method: POST
    */
    setIsLoading(true)

    const itemData: Record<string, string | number | string[] | undefined | boolean> = {
      'item[type]': itemType,
      'item[position]': itemCount + 1,
      'item[indent]': indentation,
      'quiz_lti': false,
      'content_details[]': 'items',
      'id': 'new',
      'type': itemType,
      'new_tab': 0,
      'graded': 0,
      '_method': 'POST'
    }

    if (itemType === 'context_module_sub_header') {
      itemData['item[title]'] = textHeaderValue
      itemData['title'] = textHeaderValue
    } else if (itemType === 'external_url') {
      itemData['item[title]'] = externalUrlName
      itemData['title'] = externalUrlName
      itemData['url'] = externalUrlValue

      if (!externalUrlValue) {
        setIsLoading(false)
        return
      } else if (!externalUrlName) {
        setIsLoading(false)
        return
      }
    } else {
      const selectedItem = contentItems.find(item => item.id === inputValue)

      if (selectedItem) {
        itemData['item[id]'] = selectedItem.id
        itemData['item[title]'] = selectedItem.name
        itemData['title'] = selectedItem.name
      } else {
        itemData['item[id]'] = ''
        itemData['item[title]'] = ''
        itemData['title'] = ''
      }
    }

    submitItemData(itemData)
  }

  const submitItemData = (_itemData: Record<string, string | number | string[] | undefined | boolean>) => {
    const body = new FormData()
    Object.entries(_itemData).forEach(([key, value]) => {
      body.append(key, String(value))
    })
    doFetchApi({
      path: `/courses/${courseId}/modules/${moduleId}/items`,
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(() => {
        setIsLoading(false)
        queryClient.invalidateQueries({
          queryKey: ['moduleItems', moduleId],
          exact: false
        })
        onRequestClose()
      })
      .catch(() => {
        setIsLoading(false)
      })
  }

  const handleExited = () => {
    setItemType('assignment')
    setIndentation(0)
    setSearchText('')
    setTextHeaderValue('')
    setExternalUrlValue('')
    setExternalUrlName('')
    setIsLoading(false)

    setInputValue('')
  }

  const itemTypeLabel = useMemo(() => {
    switch (itemType) {
      case 'assignment':
        return I18n.t('Assignment')
      case 'quiz':
        return I18n.t('Quiz')
      case 'file':
        return I18n.t('File')
      case 'page':
        return I18n.t('Page')
      case 'discussion':
        return I18n.t('Discussion')
      case 'context_module_sub_header':
        return I18n.t('Text Header')
      case 'external_url':
        return I18n.t('External URL')
      case 'external_tool':
        return I18n.t('External Tool')
      default:
        return I18n.t('Item')
    }
  }, [itemType])

  const contentItems = useMemo(() => {
    if (itemType === 'context_module_sub_header') {
      return [{ id: 'new_header', name: I18n.t('Create a new header') }]
    } else if (itemType === 'external_url') {
      return [{ id: 'new_url', name: I18n.t('Create a new URL') }]
    } else {
      return [...(data?.items || [])]
    }
  }, [itemType, data?.items])

  const renderedOptions = useMemo(() => {
    if (isLoadingContent) {
      return (
        <SimpleSelect.Option
          id="loading-option"
          key="loading-option"
          value="loading-option"
        >
          {I18n.t('Loading...')}
        </SimpleSelect.Option>
      )
    }

    if (contentItems.length > 0) {
      return contentItems.map(option => (
        <SimpleSelect.Option
          id={option.id}
          key={option.id}
          value={option.id}
        >
          {option.name}
        </SimpleSelect.Option>
      ))
    }

    return <SimpleSelect.Option id="empty-option" key="empty-option" value="">---</SimpleSelect.Option>
  }, [contentItems, isLoadingContent])

  const renderContentItems = () => {
    if (isError) {
      return (
        <View as="div" padding="medium" textAlign="center">
          <Text color="danger">{I18n.t('Error loading content')}</Text>
        </View>
      )
    }

    return (
      <SimpleSelect
        renderLabel={I18n.t('Select %{itemType}', { itemType: itemTypeLabel })}
        assistiveText={I18n.t('Type or use arrow keys to navigate options. Multiple selections allowed.')}
        value={inputValue}
        onChange={(_e, {value}) => setInputValue(value as string)}
      >
        {renderedOptions}
      </SimpleSelect>
    )
  }

  const renderTextHeaderInputs = () => {
    return (
      <View as="div" margin="medium 0">
        <TextInput
          renderLabel={I18n.t('Header text')}
          placeholder={I18n.t('Enter header text')}
          value={textHeaderValue}
          onChange={(_e, value) => setTextHeaderValue(value)}
        />
      </View>
    )
  }

  const renderExternalUrlInputs = () => {
    return (
      <View as="div" margin="medium 0">
        <TextInput
          renderLabel={I18n.t('URL')}
          placeholder="https://example.com"
          value={externalUrlValue}
          onChange={(_e, value) => setExternalUrlValue(value)}
        />
        <View as="div" margin="small 0 0 0">
          <TextInput
            renderLabel={I18n.t('Page name')}
            placeholder={I18n.t('Enter page name')}
            value={externalUrlName}
            onChange={(_e, value) => setExternalUrlName(value)}
          />
        </View>
      </View>
    )
  }

  const renderItemSelectForm = () => {
    return renderContentItems()
  }

  const renderItemForm = () => {
    if (itemType === 'context_module_sub_header') {
      return renderTextHeaderInputs()
    } else if (itemType === 'external_url') {
      return renderExternalUrlInputs()
    } else {
      return renderItemSelectForm()
    }
  }

  return (
    <Modal
      as="form"
      open={isOpen}
      onDismiss={onRequestClose}
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      onExited={handleExited}
      label={I18n.t('Add Item to Module')}
      shouldCloseOnDocumentClick
      size="medium"
    >
      <Modal.Header>
        <CloseButton
          placement="end"
          offset="small"
          onClick={onRequestClose}
          screenReaderLabel={I18n.t('Close')}
        />
        <Heading level="h2">
          {I18n.t('Add an item to %{module}', { module: moduleName })}
        </Heading>
      </Modal.Header>
      <Modal.Body>
        <View as="div" margin="0 0 medium 0">
          <AddItemTypeSelector
            itemType={itemType}
            onChange={(value) => setItemType(value)}
          />
        </View>
        <FormFieldGroup
          description={<ScreenReaderContent>{I18n.t('Add an item to %{module}', { module: moduleName })}</ScreenReaderContent>}
        >
          {renderItemForm()}
          <SimpleSelect
            renderLabel={I18n.t('Indentation')}
            value={indentation}
            onChange={(_e, {value}) => setIndentation(value as number)}
          >
            <SimpleSelect.Option id="0" value={0}>
              {I18n.t('Don\'t indent')}
            </SimpleSelect.Option>
            <SimpleSelect.Option id="1" value={1}>
              {I18n.t('Indent 1 level')}
            </SimpleSelect.Option>
            <SimpleSelect.Option id="2" value={2}>
              {I18n.t('Indent 2 levels')}
            </SimpleSelect.Option>
            <SimpleSelect.Option id="3" value={3}>
              {I18n.t('Indent 3 levels')}
            </SimpleSelect.Option>
          </SimpleSelect>
        </FormFieldGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onRequestClose} disabled={isLoading} margin="0 x-small 0 0">
          {I18n.t('Cancel')}
        </Button>
        <Button
          color="primary"
          type="submit"
          disabled={isLoading}
        >
          {I18n.t('Add Item')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default AddItemModal
