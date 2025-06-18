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

import {useScope as createI18nScope} from '@canvas/i18n'
import {DummyBlock} from '../Blocks/DummyBlock'
import {ReactElement} from 'react'

const I18n = createI18nScope('page_editor')

type BlockFactory = {[key: string]: () => ReactElement}

export const blockFactory = {
  dummyBlock: () => <DummyBlock dummyValue="" />,
  simpleText: () => <p>text</p>,
  imageText: () => <p>image_text</p>,
  image: () => <p>image</p>,
} as const satisfies BlockFactory

export type BlockTypes = keyof typeof blockFactory

export type BlockData = {
  groupName: string
  items: {
    itemName: string
    id: BlockTypes
  }[]
}

export const blockData: BlockData[] = [
  {
    groupName: I18n.t('Text'),
    items: [
      {itemName: I18n.t('Simple text block'), id: 'simpleText'},
      {itemName: I18n.t('Image + text'), id: 'imageText'},
      {itemName: I18n.t('Dummy block'), id: 'dummyBlock'},
    ],
  },
  {
    groupName: I18n.t('Image'),
    items: [{itemName: I18n.t('Image'), id: 'image'}],
  },
]
