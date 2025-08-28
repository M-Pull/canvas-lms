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

require "spec_helper"

describe Accessibility::IssueSummaryController do
  let(:course) { course_model }
  let(:teacher) { user_model }
  let(:wiki_page) { wiki_page_model(course:) }
  let(:assignment) { assignment_model(course:) }
  let(:accessibility_scan) do
    AccessibilityResourceScan.create!(
      course_id: course.id,
      wiki_page_id: wiki_page.id
    )
  end

  before do
    course.enroll_teacher(teacher, enrollment_state: "active")
    user_session(teacher)
    allow(controller).to receive(:tab_enabled?).with(Course::TAB_ACCESSIBILITY).and_return(true)
  end

  describe "GET #show" do
    context "with only 1 course and only active issues" do
      context "with 3 issues of same rule type" do
        before do
          3.times do |i|
            accessibility_issue_model(
              course:,
              accessibility_resource_scan: accessibility_scan,
              node_path: "//img[#{i}]",
              rule_type: Accessibility::Rules::ImgAltRule.id,
              workflow_state: "active"
            )
          end
        end

        it "returns total 3 and correct rule breakdown" do
          get :show, params: { course_id: course.id }

          expect(response).to have_http_status(:ok)
          json_response = response.parsed_body

          expect(json_response["total"]).to eq(3)
          expect(json_response["by_rule_type"]).to eq({
                                                        Accessibility::Rules::ImgAltRule.id => 3
                                                      })
        end
      end

      context "with 2 issues of different rule types" do
        before do
          accessibility_issue_model(
            course:,
            accessibility_resource_scan: accessibility_scan,
            rule_type: Accessibility::Rules::ImgAltRule.id,
            node_path: "//img[1]",
            workflow_state: "active"
          )
          accessibility_issue_model(
            course:,
            accessibility_resource_scan: accessibility_scan,
            rule_type: Accessibility::Rules::ImgAltFilenameRule.id,
            node_path: "//img[2]",
            workflow_state: "active"
          )
        end

        it "returns total 3 and correct rule breakdown" do
          get :show, params: { course_id: course.id }

          expect(response).to have_http_status(:ok)
          json_response = response.parsed_body

          expect(json_response["total"]).to eq(2)
          expect(json_response["by_rule_type"]).to eq({
                                                        Accessibility::Rules::ImgAltRule.id => 1,
                                                        Accessibility::Rules::ImgAltFilenameRule.id => 1
                                                      })
        end
      end

      context "with 0 issues" do
        it "returns total 0 and empty rule breakdown" do
          get :show, params: { course_id: course.id }

          expect(response).to have_http_status(:ok)
          json_response = response.parsed_body

          expect(json_response["total"]).to eq(0)
          expect(json_response["by_rule_type"]).to eq({})
        end
      end
    end

    context "with only 1 course but has inactive issues as well" do
      context "with 3 active + 2 inactive issues of same rule type" do
        before do
          3.times do |i|
            accessibility_issue_model(
              course:,
              accessibility_resource_scan: accessibility_scan,
              node_path: "//img[#{i}]",
              workflow_state: "active",
              rule_type: Accessibility::Rules::ImgAltRule.id
            )
          end

          2.times do |i|
            accessibility_issue_model(
              course:,
              accessibility_resource_scan: accessibility_scan,
              node_path: "//img[#{i}]",
              workflow_state: "resolved",
              rule_type: Accessibility::Rules::ImgAltRule.id
            )
          end
        end

        it "returns total 3 and correct rule breakdown (ignoring inactive)" do
          get :show, params: { course_id: course.id }

          expect(response).to have_http_status(:ok)
          json_response = response.parsed_body

          expect(json_response["total"]).to eq(3)
          expect(json_response["by_rule_type"]).to eq({
                                                        Accessibility::Rules::ImgAltRule.id => 3
                                                      })
        end
      end

      context "with 2 active + 2 inactive issues of different rule types" do
        before do
          accessibility_issue_model(
            course:,
            accessibility_resource_scan: accessibility_scan,
            rule_type: Accessibility::Rules::ImgAltRule.id,
            node_path: "//img[1]",
            workflow_state: "active"
          )
          accessibility_issue_model(
            course:,
            accessibility_resource_scan: accessibility_scan,
            rule_type: Accessibility::Rules::ImgAltFilenameRule.id,
            node_path: "//img[2]",
            workflow_state: "active"
          )

          accessibility_issue_model(
            course:,
            accessibility_resource_scan: accessibility_scan,
            rule_type: Accessibility::Rules::ImgAltRule.id,
            node_path: "//img[1]",
            workflow_state: "resolved"
          )
          accessibility_issue_model(
            course:,
            accessibility_resource_scan: accessibility_scan,
            rule_type: Accessibility::Rules::ImgAltFilenameRule.id,
            node_path: "//img[2]",
            workflow_state: "dismissed"
          )
        end

        it "returns total 2 and correct rule breakdown (ignoring inactive)" do
          get :show, params: { course_id: course.id }

          expect(response).to have_http_status(:ok)
          json_response = response.parsed_body

          expect(json_response["total"]).to eq(2)
          expect(json_response["by_rule_type"]).to eq({
                                                        Accessibility::Rules::ImgAltRule.id => 1,
                                                        Accessibility::Rules::ImgAltFilenameRule.id => 1
                                                      })
        end
      end

      context "with 0 active + 2 inactive issues" do
        before do
          accessibility_issue_model(
            course:,
            accessibility_resource_scan: accessibility_scan,
            rule_type: Accessibility::Rules::ImgAltRule.id,
            node_path: "//img[1]",
            workflow_state: "resolved"
          )
          accessibility_issue_model(
            course:,
            accessibility_resource_scan: accessibility_scan,
            rule_type: Accessibility::Rules::ImgAltFilenameRule.id,
            node_path: "//img[2]",
            workflow_state: "dismissed"
          )
        end

        it "returns total 0 and empty rule breakdown" do
          get :show, params: { course_id: course.id }

          expect(response).to have_http_status(:ok)
          json_response = response.parsed_body

          expect(json_response["total"]).to eq(0)
          expect(json_response["by_rule_type"]).to eq({})
        end
      end
    end
  end
end
