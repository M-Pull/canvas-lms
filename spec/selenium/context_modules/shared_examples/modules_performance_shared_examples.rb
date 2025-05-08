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

require_relative "../../helpers/context_modules_common"
require_relative "../../helpers/public_courses_context"
require_relative "../page_objects/modules_index_page"
require_relative "../page_objects/modules_settings_tray"
require_relative "../../helpers/items_assign_to_tray"
require_relative "../../dashboard/pages/k5_dashboard_page"
require_relative "../../dashboard/pages/k5_dashboard_common_page"
require_relative "../../../helpers/k5_common"

shared_examples_for "module performance with module items" do |context|
  include ContextModulesCommon
  include ModulesIndexPage
  include ModulesSettingsTray
  include ItemsAssignToTray
  include K5DashboardPageObject
  include K5DashboardCommonPageObject
  include K5Common

  before do
    case context
    when :context_modules
      @mod_course = @course
      @mod_url = "/courses/#{@mod_course.id}/modules"
    when :canvas_for_elementary
      @mod_course = @subject_course
      @mod_url = "/courses/#{@mod_course.id}#modules"
    when :course_homepage
      @mod_course = @course
      @mod_url = "/courses/#{@mod_course.id}"
    end
  end

  context "pagination" do
    it "loads 11 module items with pagination" do
      uncollapse_all_modules(@mod_course, @user)
      get @mod_url
      expect(pagination_exists?(@module_list[0].id)).to be_truthy
    end

    it "loads <10 module items with pagination" do
      uncollapse_all_modules(@mod_course, @user)
      get @mod_url
      expect(pagination_exists?(@module_list[2].id)).to be_falsey
    end

    it "loads 10 module items with pagination" do
      uncollapse_all_modules(@mod_course, @user)
      get @mod_url
      expect(pagination_exists?(@module_list[1].id)).to be_falsey
    end

    it "navigates to the next page" do
      get @mod_url
      scroll_to(module_item_page_button(@module_list[0].id, "Next"))
      click_module_item_page_button(@module_list[0].id, "Next")
      wait_for_ajaximations

      keep_trying_for_attempt_times(attempts: 5, sleep_interval: 0.5) do
        expect(module_item_exists?(@course.id, 10)).to be_truthy
      end
    end

    it "navigates back to the previous page" do
      get @mod_url
      scroll_to(module_item_page_button(@module_list[0].id, "Next"))
      click_module_item_page_button(@module_list[0].id, "Next")
      wait_for_ajaximations

      keep_trying_for_attempt_times(attempts: 5, sleep_interval: 0.5) do
        puts "Previous Trying..."
        expect(module_item_page_button_selector(@module_list[0].id, "Previous")).to be_truthy
      end

      scroll_to(module_item_page_button(@module_list[0].id, "Previous"))
      click_module_item_page_button(@module_list[0].id, "Previous")
      wait_for_ajaximations

      keep_trying_for_attempt_times(attempts: 5, sleep_interval: 0.5) do
        expect(module_item_exists?(@course.id, 0)).to be_truthy
      end
    end

    it "navigates to the second page" do
      get @mod_url
      scroll_to(module_item_page_button(@module_list[0].id, "2"))
      click_module_item_page_button(@module_list[0].id, "2")
      wait_for_ajaximations

      keep_trying_for_attempt_times(attempts: 5, sleep_interval: 0.5) do
        expect(module_item_exists?(@course.id, 10)).to be_truthy
      end
    end
  end
end

shared_examples_for "module show all or less" do |context|
  include ContextModulesCommon
  include ModulesIndexPage
  include ModulesSettingsTray
  include ItemsAssignToTray
  include K5DashboardPageObject
  include K5DashboardCommonPageObject
  include K5Common

  before do
    case context
    when :context_modules
      @mod_course = @course
      @mod_url = "/courses/#{@mod_course.id}/modules"
    when :canvas_for_elementary
      @mod_course = @subject_course
      @mod_url = "/courses/#{@mod_course.id}#modules"
    when :course_homepage
      @mod_course = @course
      @mod_url = "/courses/#{@mod_course.id}"
    end
  end

  context "show all or less button" do
    it "has a working Show More/Show Less buttons on a paginated module" do
      get @mod_url
      wait_for_dom_ready
      expect(context_module(@module.id)).to be_displayed
      expect(ff(module_items_selector(@module.id)).size).to eq(10)
      expect(show_all_button).to be_displayed
      show_all_button.click
      expect(show_less_button).to be_displayed
      expect(ff(module_items_selector(@module.id)).size).to eq(11)
      show_less_button.click
      expect(show_all_button).to be_displayed
      expect(ff(module_items_selector(@module.id)).size).to eq(10)
    end

    it "has neither button on a collapsed module" do
      get @mod_url
      wait_for_dom_ready
      collapse_module_link(@module.id).click
      expect(context_module(@module.id)).not_to contain_css(show_all_or_less_button_selector)
    end

    it "shows the number of items in the module" do
      get @mod_url
      wait_for_dom_ready
      expect(show_all_button.text).to include("(11)")
    end

    context "with one less item" do
      before do
        @module.content_tags.last.destroy
      end

      it "has neither button on a collapsed module" do
        get @mod_url
        wait_for_dom_ready
        expect(context_module(@module.id)).not_to contain_css(show_all_or_less_button_selector)
      end
    end
  end
end
