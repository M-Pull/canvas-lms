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

import {fireEvent, RenderResult} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {ButtonBlockSettings} from '../ButtonBlockSettings'
import {renderBlock} from '../../__tests__/render-helper'

const defaultProps = {
  settings: {
    includeBlockTitle: false,
    alignment: 'left',
    layout: 'horizontal',
    isFullWidth: false,
    buttons: [{id: 1, text: 'Button1'}],
  },
}

const toggleSection = async (component: RenderResult, name: RegExp | string) => {
  const button = component.getByRole('button', {name})
  await userEvent.click(button)
}

describe('ButtonBlockSettings', () => {
  describe('include title', () => {
    it('integrates, changing the state', () => {
      const component = renderBlock(ButtonBlockSettings, defaultProps)
      const checkbox = component.getByLabelText(/Include block title/i)
      expect(checkbox).not.toBeChecked()
      fireEvent.click(checkbox)
      expect(checkbox).toBeChecked()
    })
  })

  describe('Color settings', () => {
    it('integrates, changing the background color state', async () => {
      const component = renderBlock(ButtonBlockSettings, defaultProps)
      await toggleSection(component, /Expand color settings/i)
      const textBox = component.getByRole('textbox', {name: /background #/i})
      expect(textBox).toHaveValue('')
      fireEvent.change(textBox, {
        target: {value: '012345'},
      })
      expect(textBox).toHaveValue('012345')
    })

    it('integrates, changing the text color state', async () => {
      const component = renderBlock(ButtonBlockSettings, {
        settings: {
          ...defaultProps.settings,
          includeBlockTitle: true,
        },
      })
      await toggleSection(component, /Expand color settings/i)
      const textBox = component.getByRole('textbox', {name: /text #/i})
      expect(textBox).toHaveValue('')
      fireEvent.change(textBox, {
        target: {value: '012345'},
      })
      expect(textBox).toHaveValue('012345')
    })
  })

  describe('Individual button settings', () => {
    it('integrates, changing the buttons state', () => {
      const component = renderBlock(ButtonBlockSettings, defaultProps)

      expect(component.getAllByTestId(/button-settings-toggle-/)).toHaveLength(1)
      fireEvent.click(component.getByText('New button'))
      expect(component.getAllByTestId(/button-settings-toggle-/)).toHaveLength(2)
    })
  })

  describe('General button settings', () => {
    it('integrates, changing the alignment state', () => {
      const component = renderBlock(ButtonBlockSettings, defaultProps)

      expect(component.getByLabelText('Right aligned')).not.toBeChecked()
      fireEvent.click(component.getByLabelText('Right aligned'))
      expect(component.getByLabelText('Right aligned')).toBeChecked()
    })

    it('integrates, changing the layout state', () => {
      const component = renderBlock(ButtonBlockSettings, defaultProps)

      expect(component.getByLabelText('Vertical')).not.toBeChecked()
      fireEvent.click(component.getByLabelText('Vertical'))
      expect(component.getByLabelText('Vertical')).toBeChecked()
    })

    it('integrates, changing the isFullWidth state', () => {
      const component = renderBlock(ButtonBlockSettings, defaultProps)

      expect(component.getByLabelText('Full width buttons')).not.toBeChecked()
      fireEvent.click(component.getByLabelText('Full width buttons'))
      expect(component.getByLabelText('Full width buttons')).toBeChecked()
    })
  })
})
