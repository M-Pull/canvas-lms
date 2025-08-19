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

import React from 'react'
import {useScope as createI18nScope} from '@canvas/i18n'
import {Flex} from '@instructure/ui-flex'
import {View} from '@instructure/ui-view'
import {Text} from '@instructure/ui-text'
import {Link} from '@instructure/ui-link'
import {Avatar} from '@instructure/ui-avatar'
import {IconButton} from '@instructure/ui-buttons'
import {IconCheckMarkSolid, IconEmptyLine} from '@instructure/ui-icons'
import {Spinner} from '@instructure/ui-spinner'
import FriendlyDatetime from '@canvas/datetime/react/components/FriendlyDatetime'
import type {Announcement} from '../../../types'
import {useToggleAnnouncementReadState} from '../../../hooks/useToggleAnnouncementReadState'

const I18n = createI18nScope('widget_dashboard')

const truncateText = (text: string, maxLength: number = 80): string => {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

interface TruncatedTextProps {
  children: string
  maxLength?: number
}

const TruncatedText: React.FC<TruncatedTextProps> = ({children, maxLength = 80}) => (
  <span title={children.length > maxLength ? children : undefined}>
    {truncateText(children, maxLength)}
  </span>
)

interface AnnouncementItemProps {
  announcement: Announcement
}

const AnnouncementItem: React.FC<AnnouncementItemProps> = ({announcement}) => {
  const toggleReadState = useToggleAnnouncementReadState()

  const handleToggleReadState = async () => {
    try {
      await toggleReadState.mutateAsync({
        discussionTopicId: announcement.id,
        read: !announcement.isRead,
      })
    } catch (error) {
      console.error('Failed to toggle read state:', error)
    }
  }

  const renderReadUnreadButton = () => {
    if (toggleReadState.isPending) {
      return (
        <IconButton
          size="small"
          withBackground={false}
          withBorder={false}
          screenReaderLabel={I18n.t('Updating...')}
          disabled={true}
          data-testid={`updating-${announcement.id}`}
        >
          <Spinner size="x-small" renderTitle={I18n.t('Updating read status')} />
        </IconButton>
      )
    }

    if (announcement.isRead) {
      return (
        <IconButton
          size="small"
          withBackground={false}
          withBorder={false}
          screenReaderLabel={I18n.t('Mark as unread')}
          onClick={handleToggleReadState}
          disabled={toggleReadState.isPending}
          data-testid={`mark-unread-${announcement.id}`}
        >
          <IconCheckMarkSolid color="success" size="x-small" />
        </IconButton>
      )
    } else {
      return (
        <IconButton
          size="small"
          withBackground={false}
          withBorder={false}
          screenReaderLabel={I18n.t('Mark as read')}
          onClick={handleToggleReadState}
          disabled={toggleReadState.isPending}
          data-testid={`mark-read-${announcement.id}`}
        >
          <IconEmptyLine color="secondary" size="x-small" />
        </IconButton>
      )
    }
  }

  return (
    <View
      as="div"
      padding="small"
      borderWidth="0 0 small 0"
      borderColor="primary"
      width="100%"
      maxWidth="100%"
    >
      <Flex direction="column" gap="xxx-small">
        <Flex.Item>
          <Flex direction="row" gap="small">
            {/* Avatar */}
            <Flex.Item shouldShrink>
              <Avatar
                name={announcement.author?.name || 'Unknown Author'}
                src={announcement.author?.avatarUrl}
                size="small"
              />
            </Flex.Item>

            {/* Content Grid */}
            <Flex.Item shouldGrow shouldShrink>
              <Flex direction="column" gap="xxx-small">
                {/* Row 1: Title and read/unread indicator */}
                <Flex.Item shouldShrink>
                  <Flex direction="row" justifyItems="space-between" alignItems="start" gap="small">
                    <Flex.Item shouldGrow shouldShrink>
                      <Link href={announcement.html_url} isWithinText={false}>
                        <Text weight="bold" size="small" wrap="normal" color="primary">
                          <TruncatedText maxLength={25}>{announcement.title}</TruncatedText>
                        </Text>
                      </Link>
                    </Flex.Item>
                    <Flex.Item shouldShrink={false}>{renderReadUnreadButton()}</Flex.Item>
                  </Flex>
                </Flex.Item>

                {/* Row 2: Course code */}
                <Flex.Item>
                  <Text size="x-small" color="brand" weight="bold">
                    {announcement.course?.courseCode || 'Unknown'}
                  </Text>
                </Flex.Item>

                {/* Row 3: Posted date */}
                <Flex.Item>
                  <Text size="x-small" color="secondary">
                    <FriendlyDatetime
                      dateTime={announcement.posted_at}
                      format={I18n.t('#date.formats.medium')}
                      alwaysUseSpecifiedFormat={true}
                    />
                  </Text>
                </Flex.Item>
              </Flex>
            </Flex.Item>
          </Flex>
        </Flex.Item>
        <Flex.Item>
          {/* Message section - full width below avatar + content */}
          {announcement.message && (
            <View padding="0 0 0 xxx-small">
              <Text size="x-small">
                <TruncatedText maxLength={80}>
                  {announcement.message.replace(/<[^>]*>/g, '')}
                </TruncatedText>
              </Text>
            </View>
          )}
        </Flex.Item>
        <Flex.Item>
          {/* Read more section - full width */}
          {announcement.message && (
            <View padding="0 0 0 xxx-small">
              <Link href={announcement.html_url} isWithinText={false}>
                <Text size="x-small" color="brand">
                  {I18n.t('Read more')}
                </Text>
              </Link>
            </View>
          )}
        </Flex.Item>
      </Flex>
    </View>
  )
}

export default AnnouncementItem
