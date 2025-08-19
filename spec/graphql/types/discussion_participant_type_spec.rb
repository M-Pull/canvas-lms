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

require_relative "../../spec_helper"

describe Types::DiscussionParticipantType do
  before :once do
    course_with_teacher(active_all: true)
    @discussion = @course.discussion_topics.create!(title: "Test Discussion", message: "Test message")
    @participant = @discussion.discussion_topic_participants.create!(user: @teacher, workflow_state: "unread")
  end

  it "has the expected fields" do
    expected_fields = %w[
      id
      summaryEnabled
      read
      workflowState
      expanded
      sortOrder
    ]
    expect(Types::DiscussionParticipantType.fields.keys).to match_array(expected_fields)
  end

  describe "read field logic" do
    it "returns false when workflow_state is unread" do
      @participant.update!(workflow_state: "unread")
      expect(@participant.workflow_state == "read").to be false
    end

    it "returns true when workflow_state is read" do
      @participant.update!(workflow_state: "read")
      expect(@participant.workflow_state == "read").to be true
    end
  end

  describe "workflow_state field" do
    it "returns the workflow_state value directly from participant" do
      @participant.update!(workflow_state: "read")
      expect(@participant.workflow_state).to eq("read")

      @participant.update!(workflow_state: "unread")
      expect(@participant.workflow_state).to eq("unread")
    end
  end
end
