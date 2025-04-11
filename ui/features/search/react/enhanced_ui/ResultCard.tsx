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
import {Text} from '@instructure/ui-text'
import {Link} from '@instructure/ui-link'
import {Heading} from '@instructure/ui-heading'
import {Flex} from '@instructure/ui-flex'
import {
  IconAssignmentLine,
  IconDocumentLine,
  IconAnnouncementLine,
  IconDiscussionLine,
} from '@instructure/ui-icons'
import stopwords from '../stopwords'
import {Result} from '../types'

const icon_class = (content_type: string) => {
  switch (content_type) {
    case 'Assignment':
      return <IconAssignmentLine color="brand" size="x-small" data-testid="assignment_icon" />
    case 'Announcement':
      return <IconAnnouncementLine color="brand" size="x-small" data-testid="announcement_icon" />
    case 'DiscussionTopic':
      return <IconDiscussionLine color="brand" size="x-small" data-testid="discussion_icon" />
    default:
      return <IconDocumentLine color="brand" size="x-small" data-testid="document_icon" />
  }
}

interface Props {
  result: Result
  searchTerm: string
}

export default function ResultCard(props: Props) {
  // TODO: update styling
  // TODO: add module list and tags

  const {body, content_type, html_url, readable_type, title} = props.result

  const getHighlightedSegment = (searchTerm: string, text: string, maxTokens: number) => {
    // Split the searchTerm into tokens
    const searchTerms = searchTerm.split(' ')

    // Filter out single character search terms and common words
    const validSearchTerms = searchTerms.filter(
      term => term.length > 1 && !stopwords.includes(term.toLowerCase()),
    )

    // Escape each searchTerm and join them with '|'
    const escapedSearchTerms = validSearchTerms
      .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')

    // Create a RegExp that matches any of the searchTerms
    // TODO: prefix this regex with a word boundry \\b to avoid substrings
    // or figure out a way to remove stop words from the search terms
    const searchExpression = new RegExp(`(${escapedSearchTerms})`, 'gi')

    // Remove HTML tags and split the text into words
    const words = text.replace(/<[^>]*>/gm, '').split(' ')

    // Calculate the concentration of highlight words in each segment of maxTokens words
    let segmentIndex = 0
    let truncatedText = text
    if (words.length > maxTokens) {
      const segments = []
      for (let i = 0; i < words.length; i += maxTokens) {
        const segment = words.slice(i, i + maxTokens)
        const highlightCount = segment.filter(word => searchExpression.test(word)).length
        const concentration = highlightCount / segment.length
        segments.push({segment, concentration, segmentIndex: i / maxTokens})
      }

      // Keep the segment with the highest concentration
      const segmentRecord = segments.sort((a, b) => b.concentration - a.concentration)[0]

      // Join the words back into a string and add ellipses if the segment is not the first or last
      truncatedText = segmentRecord.segment.join(' ')
      segmentIndex = segmentRecord.segmentIndex
      if (segmentIndex > 0) {
        truncatedText = '...' + truncatedText
      }
      if (segmentIndex < segments.length - 1) {
        truncatedText += '...'
      }
    }

    return {truncatedText, searchExpression}
  }

  const addSearchHighlighting = (searchTerm: string, text: string) => {
    const maxTokens = 128
    const {truncatedText, searchExpression} = getHighlightedSegment(searchTerm, text, maxTokens)

    return truncatedText.replace(
      searchExpression,
      '<span data-testid="highlighted-search-item" style="background-color: rgba(0,142,226,0.2); border-radius: .25rem; padding-bottom: 3px; padding-top: 1px;">$1</span>',
    )
  }

  return (
    <Flex
      alignItems="start"
      direction="column"
      gap="xx-small"
      justifyItems="space-between"
      data-testid="search-result"
    >
      <Heading as="h2" level="h3">
        {title}
      </Heading>
      <Link
        href={html_url}
        isWithinText={false}
        target="_blank"
        renderIcon={icon_class(content_type)}
      >
        {readable_type}
      </Link>
      <Text
        as="p"
        dangerouslySetInnerHTML={{
          __html: addSearchHighlighting(props.searchTerm, body),
        }}
      />
    </Flex>
  )
}
