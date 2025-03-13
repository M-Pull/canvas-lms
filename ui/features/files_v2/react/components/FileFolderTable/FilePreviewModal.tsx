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

import React, {useState, useEffect} from 'react'
import {useScope as createI18nScope} from '@canvas/i18n'
import {Modal} from '@instructure/ui-modal'
import FilePreviewTray from './FilePreviewTray'
import {DrawerLayout} from '@instructure/ui-drawer-layout'
import {Flex} from '@instructure/ui-flex'
import {Heading} from '@instructure/ui-heading'
import {TruncateText} from '@instructure/ui-truncate-text'
import {IconButton, Button} from '@instructure/ui-buttons'
import {
  IconArrowEndLine,
  IconArrowStartLine,
  IconImageSolid,
  IconInfoSolid,
  IconDownloadSolid,
  IconPrinterSolid,
  IconXSolid,
} from '@instructure/ui-icons'
import StudioMediaPlayer from '@canvas/canvas-studio-player'
import {type File} from '../../../interfaces/File'
import {generatePreviewUrlPath} from '../../../utils/fileUtils'
import NoFilePreviewAvailable from './NoFilePreviewAvailable'
import FilePreviewIframe from './FilePreviewIframe'
import {MediaInfo} from "@canvas/canvas-studio-player/react/types";

const I18n = createI18nScope('files_v2')

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  item: File
  collection: File[]
}

const previewableTypes = ['image', 'pdf', 'html', 'doc', 'text']
const mediaTypes = ['video', 'audio']

const FilePreview = ({item, setMediaInfo}: {
  item: File,
  setMediaInfo: React.Dispatch<React.SetStateAction<MediaInfo>>
}) => {
  if (item.preview_url && previewableTypes.includes(item.mime_class)) {
    return <FilePreviewIframe item={item} />
  } else if (mediaTypes.includes(item.mime_class)) {
    return (
      <Flex as="div" alignItems="center" height="100%" justifyItems="center" wrap="wrap" style={{color: '#000'}}>
        <StudioMediaPlayer
          media_id={item.media_entry_id || ''}
          type={
            mediaTypes.includes(item.mime_class)
              ? (item.mime_class as 'video' | 'audio')
              : undefined
          }
          is_attachment={true}
          attachment_id={item.id}
          show_loader={true}
          maxHeight={'100%'}
          mediaFetchCallback={(response) => {
            setMediaInfo(response)
          }}
        />
      </Flex>
    )
  } else {
    return <NoFilePreviewAvailable item={item} />
  }
}

const FilePreviewModal = ({isOpen, onClose, item, collection}: FilePreviewModalProps) => {
  const [currentItem, setCurrentItem] = useState<File>(item)
  const [currentIndex, setCurrentIndex] = useState<number>(collection.indexOf(item))
  const [isTrayOpen, setIsTrayOpen] = useState(false)
  const name = currentItem.display_name

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

  const renderNavigationButtons = () => {
    return (
      collection.length > 1 && (
        <Flex gap="x-small">
          <Flex.Item>
            <Button
              onClick={handlePrevious}
              withBackground={false}
              color="primary-inverse"
              data-testid="previous-button"
            >
              <Flex gap="x-small">
                <Flex.Item>
                  <IconArrowStartLine />
                </Flex.Item>
                <Flex.Item>{I18n.t('Previous')}</Flex.Item>
              </Flex>
            </Button>
          </Flex.Item>
          <Flex.Item>
            <Button
              onClick={handleNext}
              withBackground={false}
              color="primary-inverse"
              data-testid="next-button"
            >
              <Flex gap="x-small">
                <Flex.Item>{I18n.t('Next')}</Flex.Item>
                <Flex.Item>
                  <IconArrowEndLine />
                </Flex.Item>
              </Flex>
            </Button>
          </Flex.Item>
        </Flex>
      )
    )
  }

  const [mediaInfo, setMediaInfo] = useState<MediaInfo>({} as MediaInfo);

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
      <Modal.Body padding="none">
        <DrawerLayout onOverlayTrayChange={handleOverlayTrayChange}>
          <DrawerLayout.Content label={I18n.t('File Preview')}>
            <FilePreview item={currentItem} setMediaInfo={setMediaInfo}/>
          </DrawerLayout.Content>
          <DrawerLayout.Tray
            open={isTrayOpen}
            onClose={() => setIsTrayOpen(false)}
            placement="end"
            label={I18n.t('File Information')}
          >
            <FilePreviewTray onDismiss={() => setIsTrayOpen(false)} item={currentItem} mediaInfo={mediaInfo} />
          </DrawerLayout.Tray>
        </DrawerLayout>
      </Modal.Body>
      <Modal.Footer>
        <Flex justifyItems="space-between" width="100%">
          <Flex.Item>{renderNavigationButtons()}</Flex.Item>
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

export default FilePreviewModal
