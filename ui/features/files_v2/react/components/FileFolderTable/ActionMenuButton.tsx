/*
 * Copyright (C) 2024 - present Instructure, Inc.
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

import React, {useCallback, useContext, useMemo, useState} from 'react'
import {Button, IconButton} from '@instructure/ui-buttons'
import {useScope as createI18nScope} from '@canvas/i18n'
import {Flex} from '@instructure/ui-flex'
import {Menu} from '@instructure/ui-menu'
import {Text} from '@instructure/ui-text'
import {FileManagementContext} from '../Contexts'
import {type File, type Folder} from '../../../interfaces/File'
import {RenameModal} from '../RenameModal'

import {
  IconMoreLine,
  IconArrowOpenDownLine,
  IconDownloadLine,
  IconTrashLine,
  IconEditLine,
  IconUserLine,
  IconDuplicateLine,
  IconPermissionsLine,
  IconCloudLockLine,
  IconExpandItemsLine,
} from '@instructure/ui-icons'
import DirectShareUserTray from './DirectShareUserTray'

const I18n = createI18nScope('files_v2')

interface ActionMenuButtonProps {
  size: 'small' | 'medium' | 'large'
  userCanEditFilesForContext: boolean
  userCanDeleteFilesForContext: boolean
  usageRightsRequiredForContext: boolean
  row: File | Folder
}

const ActionMenuButton = ({
  size,
  userCanEditFilesForContext,
  userCanDeleteFilesForContext,
  usageRightsRequiredForContext,
  row,
}: ActionMenuButtonProps) => {
  const [modal, setModal] = useState<'send-to' | null>(null)
  const actionLabel = I18n.t('Actions')
  const currentContext = useContext(FileManagementContext)
  const contextType = currentContext?.contextType
  const [renamingFile, setRenamingFile] = useState<null | File | Folder>(null)

  const triggerButton = useCallback(() => {
    return size !== 'large' ? (
      <Button
        display={size == 'small' ? 'block' : 'inline-block'}
        data-testid="action-menu-button-small"
      >
        {actionLabel} <IconArrowOpenDownLine />
      </Button>
    ) : (
      <IconButton
        renderIcon={IconMoreLine}
        withBackground={false}
        withBorder={false}
        screenReaderLabel={actionLabel}
        data-testid="action-menu-button-large"
      />
    )
  }, [actionLabel, size])

  const renderMenuItem = useCallback(
    (
      index: number,
      {
        icon,
        text,
        separator,
        onClick,
      }: {
        icon?: any
        text?: string
        separator?: boolean
        visible?: boolean
        onClick?: (e: React.MouseEvent) => void
      },
    ) => {
      const key = index + '-' + row.id
      if (separator) {
        return <Menu.Separator key={key} />
      }
      return (
        <Menu.Item key={key} onClick={onClick}>
          <Flex alignItems="center" gap="x-small">
            <Flex.Item>{React.createElement(icon, {inline: false})}</Flex.Item>
            <Flex.Item>
              <Text>{text}</Text>
            </Flex.Item>
          </Flex>
        </Menu.Item>
      )
    },
    [row.id],
  )

  const blueprint_locked =
    row.folder_id && row.restricted_by_master_course && row.is_master_course_child_content
  const has_usage_rights =
    contextType !== 'groups' && userCanEditFilesForContext && usageRightsRequiredForContext
  const send_copy_permissions = contextType === 'course' && userCanEditFilesForContext
  const rename_move_permissions = userCanEditFilesForContext && !blueprint_locked
  const delete_permissions = userCanDeleteFilesForContext && !blueprint_locked

  const filteredItems = useMemo(
    () =>
      (row.folder_id
        ? [
            // files
            {
              icon: IconEditLine,
              text: I18n.t('Rename'),
              visible: rename_move_permissions,
              onClick: () => {
                setRenamingFile(row)
              },
            },
            {icon: IconDownloadLine, text: I18n.t('Download')},
            {
              icon: IconPermissionsLine,
              text: I18n.t('Edit Permissions'),
              visible: userCanEditFilesForContext,
            },
            {
              icon: IconCloudLockLine,
              text: I18n.t('Manage Usage Rights'),
              visible: has_usage_rights,
            },
            {
              icon: IconUserLine,
              text: I18n.t('Send To...'),
              visible: send_copy_permissions,
              onClick: () => setModal('send-to'),
            },
            {icon: IconDuplicateLine, text: I18n.t('Copy To...'), visible: send_copy_permissions},
            {
              icon: IconExpandItemsLine,
              text: I18n.t('Move To...'),
              visible: rename_move_permissions,
            },
            {separator: true, visible: delete_permissions},
            {icon: IconTrashLine, text: I18n.t('Delete'), visible: delete_permissions},
          ]
        : [
            // folder
            {icon: IconEditLine, text: I18n.t('Rename'), visible: rename_move_permissions},
            {icon: IconDownloadLine, text: I18n.t('Download')},
            {
              icon: IconPermissionsLine,
              text: I18n.t('Edit Permissions'),
              visible: userCanEditFilesForContext,
            },
            {
              icon: IconCloudLockLine,
              text: I18n.t('Manage Usage Rights'),
              visible: has_usage_rights,
            },
            {
              icon: IconExpandItemsLine,
              text: I18n.t('Move To...'),
              visible: rename_move_permissions,
            },
            {separator: true, visible: delete_permissions},
            {icon: IconTrashLine, text: I18n.t('Delete'), visible: delete_permissions},
          ]
      ).filter(({visible}) => visible !== false),
    [
      delete_permissions,
      has_usage_rights,
      rename_move_permissions,
      row,
      send_copy_permissions,
      userCanEditFilesForContext,
    ],
  )

  const onDismissTray = useCallback(() => setModal(null), [])

  const buildTrays = useCallback(() => {
    let file
    if (row.filename) {
      file = row as File
    }
    return (
      <>
        {file && ENV.COURSE_ID && (
          <DirectShareUserTray
            open={modal === 'send-to'}
            onDismiss={onDismissTray}
            courseId={ENV.COURSE_ID}
            file={file}
          />
        )}
      </>
    )
  }, [modal, onDismissTray, row])

  return (
    <>
      <Menu placement="bottom" trigger={triggerButton()}>
        {filteredItems.map((item, i) => renderMenuItem(i, item))}
      </Menu>
      <RenameModal renamingFile={renamingFile} setRenamingFile={setRenamingFile} />
      {buildTrays()}
    </>
  )
}

export default ActionMenuButton
