# frozen_string_literal: true

#
# Copyright (C) 2025 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.

require_relative "../../common"

module Modules2ActionTray
  #------------------------------ Selectors -----------------------------
  def add_module_tray_selector
    "div[role='dialog'][aria-label='Add Module']"
  end

  def prerequisites_dropdown_selector
    "//*[starts-with(@id, 'prerequisite-')]"
  end

  def add_module_button_selector
    "#context-modules-header-add-module-button"
  end

  def tray_header_label_selector
    "h2[data-testid='header-label']"
  end

  def input_module_name_selector
    "[data-testid='module-name-input']"
  end

  def add_prerequisite_button_selector
    "//*[@data-testid = 'prerequisite-form']//button[.//*[.='Prerequisite']]"
  end

  def submit_add_module_button_selector
    "button[data-testid='differentiated_modules_save_button']"
  end

  def module_settings_tray_selector
    "[aria-label='Edit Module Settings']"
  end

  def everyone_radio_checked_selector
    "[data-testid = 'everyone-option']"
  end

  def custom_access_radio_checked_selector
    "[data-testid = 'custom-option']"
  end

  def custom_access_radio_click_selector
    "//label[../input[@data-testid = 'custom-option']]"
  end

  def assignee_selection_selector
    "[data-testid='assignee_selector']"
  end

  def assignee_selection_item_selector
    "[data-testid='assignee_selector_selected_option']"
  end

  def assignee_selection_item_remove_selector(assignee)
    "//*[@data-testid='assignee_selector_selected_option']//*[contains(@title, 'Remove #{assignee}')]"
  end

  def clear_all_selector
    "[data-testid='clear_selection_button']"
  end

  def module_index_menu_tool_link_selector(tool_text)
    "[role=menuitem]:contains('#{tool_text}')"
  end

  def assign_to_error_message_selector
    "#TextInput-messages___0"
  end

  def convert_differentiated_tag_button_selector
    "[data-testid='convert-differentiation-tags-button']"
  end

  #------------------------------ Elements ------------------------------
  def add_module_button
    f(add_module_button_selector)
  end

  def add_module_tray
    f(add_module_tray_selector)
  end

  def tray_header_label
    f(tray_header_label_selector)
  end

  def input_module_name
    f(input_module_name_selector)
  end

  def add_prerequisite_button
    fxpath(add_prerequisite_button_selector)
  end

  def prerequisites_dropdown
    ffxpath(prerequisites_dropdown_selector)
  end

  def prerequisites_dropdown_value(dropdown_list_item)
    element_value_for_attr(prerequisites_dropdown[dropdown_list_item], "value")
  end

  def submit_add_module_button
    f(submit_add_module_button_selector)
  end

  def module_settings_tray
    f(module_settings_tray_selector)
  end

  def everyone_radio_checked
    f(everyone_radio_checked_selector)
  end

  def custom_access_radio_click
    fxpath(custom_access_radio_click_selector)
  end

  def custom_access_radio_checked
    f(custom_access_radio_checked_selector)
  end

  def assignee_selection
    f(assignee_selection_selector)
  end

  def assignee_selection_item
    ff(assignee_selection_item_selector)
  end

  def assignee_selection_item_remove(assignee)
    fxpath(assignee_selection_item_remove_selector(assignee))
  end

  def clear_all
    f(clear_all_selector)
  end

  def module_index_menu_tool_link(tool_text)
    fj(module_index_menu_tool_link_selector(tool_text))
  end

  def assign_to_error_message
    f(assign_to_error_message_selector)
  end

  def convert_differentiated_tag_button
    f(convert_differentiated_tag_button_selector)
  end

  #------------------------------ Actions -------------------------------
  def fill_in_module_name(name)
    replace_content(input_module_name, name)
  end

  def select_prerequisites_dropdown_option(item_number, option)
    click_option(prerequisites_dropdown[item_number], option)
  end

  def settings_tray_exists?
    element_exists?(module_settings_tray_selector)
  end
end
