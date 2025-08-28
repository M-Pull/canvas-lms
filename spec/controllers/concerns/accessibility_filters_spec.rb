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
#
require "spec_helper"

describe AccessibilityFilters do
  let(:course) { course_model }
  let(:teacher) { user_model }

  let(:dummy_controller) do
    Class.new do
      include AccessibilityFilters

      def initialize(params = {})
        @params = params
      end

      attr_reader :params
    end
  end

  let(:controller) { dummy_controller.new }

  before do
    course.enroll_teacher(teacher, enrollment_state: "active")
  end

  describe "#apply_accessibility_filters" do
    # Test data resources
    let(:wiki_page1) { wiki_page_model(course:, title: "Page 1") }
    let(:wiki_page2) { wiki_page_model(course:, title: "Page 2") }
    let(:wiki_page3) { wiki_page_model(course:, title: "Page 3") }
    let(:wiki_page4) { wiki_page_model(course:, title: "Page 4") }
    let(:assignment1) { assignment_model(course:, title: "Assignment 1") }
    let(:assignment2) { assignment_model(course:, title: "Assignment 2") }
    let(:assignment3) { assignment_model(course:, title: "Assignment 3") }
    let(:assignment4) { assignment_model(course:, title: "Assignment 4") }

    let(:today) { Time.zone.now }
    let(:yesterday) { 1.day.ago }

    # Rule type constants for clarity
    let(:list_structure_rule) { Accessibility::Rules::ListStructureRule.id }
    let(:heading_sequence_rule) { Accessibility::Rules::HeadingsSequenceRule.id }

    let!(:page_published_today_list) do
      scan = create_scan(wiki_page1, "published", today)
      create_issue(scan, list_structure_rule)
      scan
    end

    let!(:page_published_yesterday_heading) do
      scan = create_scan(wiki_page2, "published", yesterday)
      create_issue(scan, heading_sequence_rule)
      scan
    end

    let!(:page_unpublished_today_list) do
      scan = create_scan(wiki_page3, "unpublished", today)
      create_issue(scan, list_structure_rule)
      scan
    end

    let!(:page_unpublished_yesterday_heading) do
      scan = create_scan(wiki_page4, "unpublished", yesterday)
      create_issue(scan, heading_sequence_rule)
      scan
    end

    let!(:assignment_published_today_list) do
      scan = create_scan(assignment1, "published", today)
      create_issue(scan, list_structure_rule)
      scan
    end

    let!(:assignment_published_yesterday_heading) do
      scan = create_scan(assignment2, "published", yesterday)
      create_issue(scan, heading_sequence_rule)
      scan
    end

    let!(:assignment_unpublished_today_list) do
      scan = create_scan(assignment3, "unpublished", today)
      create_issue(scan, list_structure_rule)
      scan
    end

    let!(:assignment_unpublished_yesterday_heading) do
      scan = create_scan(assignment4, "unpublished", yesterday)
      create_issue(scan, heading_sequence_rule)
      scan
    end

    let(:all_scans) do
      [
        page_published_today_list,
        page_published_yesterday_heading,
        page_unpublished_today_list,
        page_unpublished_yesterday_heading,
        assignment_published_today_list,
        assignment_published_yesterday_heading,
        assignment_unpublished_today_list,
        assignment_unpublished_yesterday_heading
      ]
    end

    let(:base_relation) { AccessibilityResourceScan.where(course_id: course.id) }

    context "with no filters" do
      it "returns all scans when filters is nil" do
        result = controller.apply_accessibility_filters(base_relation, nil)
        expect(result.to_a).to match_array(all_scans)
      end

      it "returns all scans when filters is empty hash" do
        result = controller.apply_accessibility_filters(base_relation, {})
        expect(result.to_a).to match_array(all_scans)
      end
    end

    context "with rule type filters" do
      it "returns only scans with list-structure rule type" do
        filters = { ruleTypes: [list_structure_rule] }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expected_scans = [
          page_published_today_list,
          page_unpublished_today_list,
          assignment_published_today_list,
          assignment_unpublished_today_list
        ]

        expect(result.to_a).to match_array(expected_scans)
      end

      it "returns only scans with heading-sequence rule type" do
        filters = { ruleTypes: [heading_sequence_rule] }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expected_scans = [
          page_published_yesterday_heading,
          page_unpublished_yesterday_heading,
          assignment_published_yesterday_heading,
          assignment_unpublished_yesterday_heading
        ]

        expect(result.to_a).to match_array(expected_scans)
      end

      it "returns scans with multiple rule types" do
        filters = { ruleTypes: [list_structure_rule, heading_sequence_rule] }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expect(result.to_a).to match_array(all_scans)
      end

      it "returns empty when filtering by non-existent rule type" do
        filters = { ruleTypes: ["non-existent-rule"] }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expect(result.to_a).to be_empty
      end
    end

    context "with resource type filters" do
      it "returns only wiki page scans" do
        filters = { artifactTypes: ["wiki_page"] }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expected_scans = [
          page_published_today_list,
          page_published_yesterday_heading,
          page_unpublished_today_list,
          page_unpublished_yesterday_heading
        ]

        expect(result.to_a).to match_array(expected_scans)
      end

      it "returns only assignment scans" do
        filters = { artifactTypes: ["assignment"] }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expected_scans = [
          assignment_published_today_list,
          assignment_published_yesterday_heading,
          assignment_unpublished_today_list,
          assignment_unpublished_yesterday_heading
        ]

        expect(result.to_a).to match_array(expected_scans)
      end

      it "returns scans with multiple resource types" do
        filters = { artifactTypes: ["wiki_page", "assignment"] }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expect(result.to_a).to match_array(all_scans)
      end

      it "returns empty when filtering by non-existent resource type" do
        filters = { artifactTypes: ["non-existent-type"] }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expect(result.to_a).to be_empty
      end
    end

    context "with workflow state filters" do
      it "returns only published scans" do
        filters = { workflowStates: ["published"] }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expected_scans = [
          page_published_today_list,
          page_published_yesterday_heading,
          assignment_published_today_list,
          assignment_published_yesterday_heading
        ]

        expect(result.to_a).to match_array(expected_scans)
      end

      it "returns only unpublished scans" do
        filters = { workflowStates: ["unpublished"] }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expected_scans = [
          page_unpublished_today_list,
          page_unpublished_yesterday_heading,
          assignment_unpublished_today_list,
          assignment_unpublished_yesterday_heading
        ]

        expect(result.to_a).to match_array(expected_scans)
      end

      it "returns scans with multiple workflow states" do
        filters = { workflowStates: ["published", "unpublished"] }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expect(result.to_a).to match_array(all_scans)
      end

      it "returns empty when filtering by non-existent workflow state" do
        filters = { workflowStates: ["non-existent-state"] }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expect(result.to_a).to be_empty
      end
    end

    context "with date filters" do
      it "returns scans from before today" do
        filters = { toDate: today.beginning_of_day.iso8601 }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expected_scans = [
          page_published_yesterday_heading,
          page_unpublished_yesterday_heading,
          assignment_published_yesterday_heading,
          assignment_unpublished_yesterday_heading
        ]

        expect(result.to_a).to match_array(expected_scans)
      end

      it "returns scans from after yesterday" do
        filters = { fromDate: yesterday.end_of_day.iso8601 }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expected_scans = [
          page_published_today_list,
          page_unpublished_today_list,
          assignment_published_today_list,
          assignment_unpublished_today_list
        ]

        expect(result.to_a).to match_array(expected_scans)
      end

      it "returns scans between yesterday and today" do
        filters = {
          fromDate: yesterday.beginning_of_day.iso8601,
          toDate: today.end_of_day.iso8601
        }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expect(result.to_a).to match_array(all_scans)
      end

      it "handles invalid date strings gracefully" do
        filters = {
          fromDate: "invalid-date",
          toDate: "also-invalid"
        }
        result = controller.apply_accessibility_filters(base_relation, filters)

        # Should return all scans since invalid dates are ignored
        expect(result.to_a).to match_array(all_scans)
      end

      it "returns empty when date range excludes all scans" do
        filters = {
          fromDate: 2.days.ago.iso8601,
          toDate: 2.days.ago.end_of_day.iso8601
        }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expect(result.to_a).to be_empty
      end
    end

    context "with combined filters" do
      it "applies multiple filters with AND logic" do
        filters = {
          ruleTypes: [list_structure_rule],
          artifactTypes: ["wiki_page"],
          workflowStates: ["published"]
        }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expected_scans = [page_published_today_list]

        expect(result.to_a).to match_array(expected_scans)
      end

      it "applies date and rule type filters together" do
        filters = {
          ruleTypes: [heading_sequence_rule],
          fromDate: yesterday.beginning_of_day.iso8601,
          toDate: yesterday.end_of_day.iso8601
        }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expected_scans = [
          page_published_yesterday_heading,
          page_unpublished_yesterday_heading,
          assignment_published_yesterday_heading,
          assignment_unpublished_yesterday_heading
        ]

        expect(result.to_a).to match_array(expected_scans)
      end

      it "returns empty when combined filters match no scans" do
        filters = {
          ruleTypes: [list_structure_rule],
          artifactTypes: ["wiki_page"],
          workflowStates: ["unpublished"],
          fromDate: yesterday.beginning_of_day.iso8601,
          toDate: yesterday.end_of_day.iso8601
        }
        result = controller.apply_accessibility_filters(base_relation, filters)

        expect(result.to_a).to be_empty
      end
    end
  end

  private

  def create_scan(resource, workflow_state, date)
    accessibility_resource_scan_model(
      course:,
      context: resource,
      resource_workflow_state: workflow_state,
      resource_updated_at: date
    )
  end

  def create_issue(scan, rule_id)
    accessibility_issue_model(
      course:,
      accessibility_resource_scan: scan,
      rule_type: rule_id
    )
  end
end
