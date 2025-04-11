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

import {useState, useEffect} from 'react'
import {useScope as createI18nScope} from '@canvas/i18n'
import {Modal} from '@instructure/ui-modal'
import {FilePreviewTray} from './FilePreviewTray'
import {DrawerLayout} from '@instructure/ui-drawer-layout'
import {Flex} from '@instructure/ui-flex'
import {Heading} from '@instructure/ui-heading'
import {TruncateText} from '@instructure/ui-truncate-text'
import {IconButton, Button} from '@instructure/ui-buttons'
import {
  IconImageSolid,
  IconInfoSolid,
  IconDownloadSolid,
  IconPrinterSolid,
  IconXSolid,
} from '@instructure/ui-icons'
import {type File} from '../../../interfaces/File'
import {generatePreviewUrlPath} from '../../../utils/fileUtils'
import {FilePreview, mediaTypes} from './FilePreview'
import {FilePreviewNavigationButtons} from './FilePreviewNavigationButtons'
import {useFetchMedia} from './useFetchMedia'

const I18n = createI18nScope('files_v2')

export interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  item: File
  collection: File[]
}

const previewableTypes = ['image', 'pdf', 'html', 'doc', 'text']

export const FilePreviewModal = ({isOpen, onClose, item, collection}: FilePreviewModalProps) => {
  const [currentItem, setCurrentItem] = useState<File>(item)
  const [currentIndex, setCurrentIndex] = useState<number>(collection.indexOf(item))
  const [isTrayOpen, setIsTrayOpen] = useState(false)
  const name = currentItem.display_name
  const isFilePreview = !!(
    currentItem.preview_url && previewableTypes.includes(currentItem.mime_class)
  )
  const isMediaPreview = !isFilePreview && mediaTypes.includes(currentItem.mime_class)
  const isQueryEnabled = isMediaPreview && isOpen
  const {data, isFetching} = useFetchMedia({attachmentId: currentItem.id, enabled: isQueryEnabled})

  // Reset state when the modal is opened or item changes
  useEffect(() => {
    if (isOpen) {
      setCurrentItem(item)
      setCurrentIndex(collection ? collection.indexOf(item) : 0)
    }
  }, [isOpen, item, collection])

  const handleOverlayTrayChange = (isTrayOpen: boolean) => {
    setIsTrayOpen(isTrayOpen)
  }

  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search)
      const previewId = searchParams.get('preview')

      // If there's no preview ID and the modal is open, close it
      if (!previewId && isOpen) {
        onClose()
        return
      }

      // Only update state if we have a different preview ID
      if (previewId !== currentItem.id && collection) {
        const newItem = collection.find(item => item.id === previewId)
        if (newItem) {
          setCurrentItem(newItem as File)
          setCurrentIndex(collection.indexOf(newItem))
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    // Call handlePopState on mount to handle initial URL state
    handlePopState()

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onClose, currentItem.id, collection, isOpen])

  const handleNext = () => {
    const nextIndex = currentIndex + 1 >= collection.length ? 0 : currentIndex + 1
    setCurrentIndex(nextIndex)
    setCurrentItem(collection[nextIndex] as File)
    window.history.replaceState(null, '', generatePreviewUrlPath(collection[nextIndex] as File))
  }

  const handlePrevious = () => {
    const previousIndex = currentIndex - 1 < 0 ? collection.length - 1 : currentIndex - 1
    setCurrentIndex(previousIndex)
    setCurrentItem(collection[previousIndex] as File)
    window.history.replaceState(null, '', generatePreviewUrlPath(collection[previousIndex] as File))
  }

  return (
    <Modal
      open={isOpen}
      onDismiss={onClose}
      size={'fullscreen'}
      label={name}
      shouldCloseOnDocumentClick={false}
      variant="inverse"
      overflow="fit"
      defaultFocusElement={() => document.getElementById('download-button')}
    >
      <Modal.Header>
        <Flex>
          <Flex.Item shouldGrow shouldShrink>
            <Flex alignItems="center">
              <Flex.Item margin="0 medium 0 0">
                <IconImageSolid size="x-small" />
              </Flex.Item>
              <Flex.Item shouldGrow shouldShrink>
                <Heading level="h2" data-testid="file-header">
                  <TruncateText>{name}</TruncateText>
                </Heading>
              </Flex.Item>
            </Flex>
          </Flex.Item>
          <Flex.Item>
            <IconButton
              color="primary-inverse"
              withBackground={false}
              withBorder={false}
              renderIcon={IconInfoSolid}
              screenReaderLabel={I18n.t('Open file info panel')}
              margin="0 x-small 0 0"
              id="file-info-button"
              onClick={() => handleOverlayTrayChange(true)}
            />
            <IconButton
              color="primary-inverse"
              withBackground={false}
              withBorder={false}
              renderIcon={IconPrinterSolid}
              screenReaderLabel={I18n.t('Print')}
              margin="0 x-small 0 0"
              onClick={() => window.print()}
              id="print-button"
            />
            <IconButton
              color="primary-inverse"
              withBackground={false}
              withBorder={false}
              renderIcon={IconDownloadSolid}
              screenReaderLabel={I18n.t('Download')}
              margin="0 x-small 0 0"
              id="download-icon-button"
              href={currentItem.url}
            />
            <IconButton
              color="primary-inverse"
              withBackground={false}
              withBorder={false}
              renderIcon={IconXSolid}
              screenReaderLabel={I18n.t('Close')}
              onClick={onClose}
              id="close-button"
              data-testid="close-button"
            />
          </Flex.Item>
        </Flex>
      </Modal.Header>
      <Modal.Body padding="none" id="file-preview-modal-alert">
        <DrawerLayout onOverlayTrayChange={handleOverlayTrayChange}>
          <DrawerLayout.Content
            id="file-preview-modal-drawer-layout"
            label={I18n.t('File Preview')}
          >
            <FilePreview
              item={currentItem}
              mediaId={data?.media_id ?? ''}
              mediaSources={data?.media_sources ?? []}
              mediaTracks={data?.media_tracks ?? []}
              isFilePreview={isFilePreview}
              isMediaPreview={isMediaPreview}
              isFetchingMedia={isFetching}
            />
          </DrawerLayout.Content>
          <DrawerLayout.Tray
            open={isTrayOpen}
            onClose={() => setIsTrayOpen(false)}
            placement="end"
            label={I18n.t('File Information')}
          >
            <FilePreviewTray
              onDismiss={() => setIsTrayOpen(false)}
              item={currentItem}
              mediaTracks={data?.media_tracks ?? []}
              canAddTracks={data?.can_add_captions ?? false}
              isFetchingTracks={isFetching}
            />
          </DrawerLayout.Tray>
        </DrawerLayout>
      </Modal.Body>
      <Modal.Footer>
        <Flex justifyItems="space-between" width="100%">
          <Flex.Item>
            {collection.length > 1 && (
              <FilePreviewNavigationButtons
                handleNext={handleNext}
                handlePrevious={handlePrevious}
              />
            )}
          </Flex.Item>
          <Flex.Item>
            <Button onClick={onClose} withBackground={false} color="primary-inverse">
              {I18n.t('Close')}
            </Button>
          </Flex.Item>
        </Flex>
      </Modal.Footer>
    </Modal>
  )
}
