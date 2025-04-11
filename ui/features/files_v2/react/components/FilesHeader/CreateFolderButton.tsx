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

import React, {useState} from 'react'
import {IconAddLine} from '@instructure/ui-icons'
import {useScope as createI18nScope} from '@canvas/i18n'
import {Button} from '@instructure/ui-buttons'
import CreateFolderModal from './CreateFolderModal'
import {createPortal} from 'react-dom'

const I18n = createI18nScope('files_v2')

interface CreateFolderButtonProps {
  buttonDisplay: 'block' | 'inline-block'
}

const CreateFolderButton = ({buttonDisplay}: CreateFolderButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }
  return (
    <>
      {
        createPortal(
          <CreateFolderModal isOpen={isModalOpen} onRequestClose={handleCloseModal} />,
          document.body,
        )
      }
      <Button
        color="secondary"
        renderIcon={<IconAddLine />}
        display={buttonDisplay}
        onClick={handleOpenModal}
        data-testid="create-folder-button"
        elementRef={elt => elt?.setAttribute('aria-label', I18n.t('Add Folder'))}
      >
        {I18n.t('Folder')}
      </Button>
    </>
  )
}

export default CreateFolderButton
