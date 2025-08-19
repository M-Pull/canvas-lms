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

RSpec.describe PeerReview::PeerReviewCommonService do
  let(:course) { course_model(name: "Course with Assignment") }
  let(:parent_assignment) do
    assignment_model(
      course:,
      title: "Parent Assignment",
      points_possible: 10,
      grading_type: "points",
      due_at: 1.week.from_now,
      unlock_at: 1.day.from_now,
      lock_at: 2.weeks.from_now,
      peer_review_count: 2,
      peer_reviews: true,
      automatic_peer_reviews: true,
      anonymous_peer_reviews: false,
      intra_group_peer_reviews: true,
      submission_types: "online_text_entry,online_upload"
    )
  end

  let(:peer_review_grading_type) { "points" }
  let(:peer_review_points_possible) { 10 }
  let(:custom_due_at) { 3.days.from_now }
  let(:custom_unlock_at) { 2.days.from_now }
  let(:custom_lock_at) { 1.week.from_now }

  let(:service) do
    described_class.new(
      parent_assignment:,
      points_possible: peer_review_points_possible,
      grading_type: peer_review_grading_type,
      due_at: custom_due_at,
      unlock_at: custom_unlock_at,
      lock_at: custom_lock_at
    )
  end

  before do
    course.enable_feature!(:peer_review_allocation_and_grading)
  end

  describe "#initialize" do
    it "sets the instance variables correctly" do
      expect(service.instance_variable_get(:@parent_assignment)).to eq(parent_assignment)
      expect(service.instance_variable_get(:@points_possible)).to eq(peer_review_points_possible)
      expect(service.instance_variable_get(:@grading_type)).to eq(peer_review_grading_type)
      expect(service.instance_variable_get(:@due_at)).to eq(custom_due_at)
      expect(service.instance_variable_get(:@unlock_at)).to eq(custom_unlock_at)
      expect(service.instance_variable_get(:@lock_at)).to eq(custom_lock_at)
    end

    it "allows nil values for optional parameters" do
      simple_service = described_class.new(parent_assignment:)
      expect(simple_service.instance_variable_get(:@points_possible)).to be_nil
      expect(simple_service.instance_variable_get(:@grading_type)).to be_nil
      expect(simple_service.instance_variable_get(:@due_at)).to be_nil
      expect(simple_service.instance_variable_get(:@unlock_at)).to be_nil
      expect(simple_service.instance_variable_get(:@lock_at)).to be_nil
    end
  end

  describe "#validate_parent_assignment" do
    it "does not raise an error for a valid parent assignment" do
      expect { service.send(:validate_parent_assignment) }.not_to raise_error
    end

    it "raises an error when parent assignment is nil" do
      service.instance_variable_set(:@parent_assignment, nil)
      expect { service.send(:validate_parent_assignment) }.to raise_error(
        PeerReview::PeerReviewInvalidParentAssignmentError,
        "Invalid parent assignment"
      )
    end

    it "raises an error when parent assignment is not an Assignment object" do
      service.instance_variable_set(:@parent_assignment, "not an assignment")
      expect { service.send(:validate_parent_assignment) }.to raise_error(
        PeerReview::PeerReviewInvalidParentAssignmentError,
        "Invalid parent assignment"
      )
    end

    it "raises an error when parent assignment is not persisted" do
      new_assignment = Assignment.new(context: course, title: "New Assignment")
      service.instance_variable_set(:@parent_assignment, new_assignment)
      expect { service.send(:validate_parent_assignment) }.to raise_error(
        PeerReview::PeerReviewInvalidParentAssignmentError,
        "Invalid parent assignment"
      )
    end
  end

  describe "#validate_assignment_submission_types" do
    it "does not raise an error for non-external tool assignments" do
      # submission types for this assignment are "online_text_entry,online_upload"
      expect { service.send(:validate_assignment_submission_types) }.not_to raise_error
    end

    it "raises an error for external tool assignments" do
      external_tool_assignment = assignment_model(
        course:,
        title: "External Tool Assignment",
        submission_types: "external_tool"
      )
      service.instance_variable_set(:@parent_assignment, external_tool_assignment)

      expect { service.send(:validate_assignment_submission_types) }.to raise_error(
        PeerReview::PeerReviewInvalidAssignmentSubmissionTypesError,
        "Peer reviews cannot be used with External Tool assignments"
      )
    end
  end

  describe "#validate_feature_enabled" do
    it "does not raise an error when feature is enabled" do
      expect { service.send(:validate_feature_enabled) }.not_to raise_error
    end

    it "raises an error when feature is disabled" do
      course.disable_feature!(:peer_review_allocation_and_grading)
      expect { service.send(:validate_feature_enabled) }.to raise_error(
        PeerReview::PeerReviewFeatureDisabledError,
        "Peer Review Allocation and Grading feature flag is disabled"
      )
    end
  end

  describe "#validate_peer_review_not_exist" do
    it "does not raise an error when no peer review sub assignment exists" do
      expect { service.send(:validate_peer_review_sub_assignment_not_exist) }.not_to raise_error
    end

    it "raises an error when peer review sub assignment already exists" do
      PeerReviewSubAssignment.create!(parent_assignment:, context: course)
      expect { service.send(:validate_peer_review_sub_assignment_not_exist) }.to raise_error(
        PeerReview::PeerReviewSubAssignmentExistsError,
        "Peer review sub assignment exists"
      )
    end
  end

  describe "#peer_review_attributes" do
    it "returns combined inherited and specific attributes" do
      attributes = service.send(:peer_review_attributes)

      expect(attributes[:assignment_group_id]).to eq(parent_assignment.assignment_group_id)
      expect(attributes[:context_id]).to eq(parent_assignment.context_id)
      expect(attributes[:context_type]).to eq(parent_assignment.context_type)
      expect(attributes[:description]).to eq(parent_assignment.description)
      expect(attributes[:peer_review_count]).to eq(parent_assignment.peer_review_count)
      expect(attributes[:peer_reviews]).to eq(parent_assignment.peer_reviews)
      expect(attributes[:peer_reviews_due_at]).to eq(parent_assignment.peer_reviews_due_at)
      expect(attributes[:anonymous_peer_reviews]).to eq(parent_assignment.anonymous_peer_reviews)
      expect(attributes[:automatic_peer_reviews]).to eq(parent_assignment.automatic_peer_reviews)
      expect(attributes[:intra_group_peer_reviews]).to eq(parent_assignment.intra_group_peer_reviews)
      expect(attributes[:submission_types]).to eq(parent_assignment.submission_types)
      expect(attributes[:workflow_state]).to eq(parent_assignment.workflow_state)

      expect(attributes[:has_sub_assignments]).to be(false)
      expect(attributes[:title]).to eq("#{parent_assignment.title} Peer Review")
      expect(attributes[:parent_assignment_id]).to eq(parent_assignment.id)
      expect(attributes[:points_possible]).to eq(peer_review_points_possible)
      expect(attributes[:grading_type]).to eq(peer_review_grading_type)
      expect(attributes[:due_at]).to eq(custom_due_at)
      expect(attributes[:unlock_at]).to eq(custom_unlock_at)
      expect(attributes[:lock_at]).to eq(custom_lock_at)
    end
  end

  describe "#inherited_attributes" do
    it "includes all expected attributes from parent assignment" do
      inherited = service.send(:inherited_attributes)

      expected_keys = %i[
        assignment_group_id
        context_id
        context_type
        description
        peer_review_count
        peer_reviews
        peer_reviews_due_at
        peer_reviews_assigned
        anonymous_peer_reviews
        automatic_peer_reviews
        intra_group_peer_reviews
        submission_types
        workflow_state
      ]

      expect(inherited.keys).to match_array(expected_keys)
    end
  end

  describe "#specific_attributes" do
    context "with all custom parameters" do
      it "returns specific attributes with custom values" do
        specific = service.send(:specific_attributes)

        expect(specific[:has_sub_assignments]).to be(false)
        expect(specific[:title]).to eq("#{parent_assignment.title} Peer Review")
        expect(specific[:parent_assignment_id]).to eq(parent_assignment.id)
        expect(specific[:points_possible]).to eq(peer_review_points_possible)
        expect(specific[:grading_type]).to eq(peer_review_grading_type)
        expect(specific[:due_at]).to eq(custom_due_at)
        expect(specific[:unlock_at]).to eq(custom_unlock_at)
        expect(specific[:lock_at]).to eq(custom_lock_at)
      end
    end

    context "with minimal parameters" do
      let(:minimal_service) { described_class.new(parent_assignment:) }

      it "returns specific attributes without optional values" do
        specific = minimal_service.send(:specific_attributes)

        expect(specific[:has_sub_assignments]).to be(false)
        expect(specific[:title]).to eq("#{parent_assignment.title} Peer Review")
        expect(specific[:parent_assignment_id]).to eq(parent_assignment.id)
        expect(specific).not_to have_key(:points_possible)
        expect(specific).not_to have_key(:grading_type)
        expect(specific).not_to have_key(:due_at)
        expect(specific).not_to have_key(:unlock_at)
        expect(specific).not_to have_key(:lock_at)
      end
    end

    it "creates peer review title from parent assignment title appended with Peer Review" do
      expected_title = I18n.t("%{title} Peer Review", title: parent_assignment.title)
      attributes = service.send(:specific_attributes)
      expect(attributes[:title]).to eq(expected_title)
    end
  end

  describe "#attributes_to_inherit_from_parent" do
    it "returns the expected array of attribute names" do
      expected_attributes = %w[
        assignment_group_id
        context_id
        context_type
        description
        peer_review_count
        peer_reviews
        peer_reviews_due_at
        peer_reviews_assigned
        anonymous_peer_reviews
        automatic_peer_reviews
        intra_group_peer_reviews
        submission_types
        workflow_state
      ]

      expect(service.send(:attributes_to_inherit_from_parent)).to eq(expected_attributes)
    end
  end

  describe "integration with ApplicationService" do
    it "inherits from ApplicationService" do
      expect(described_class.superclass).to eq(ApplicationService)
    end

    it "responds to the call class method" do
      expect(described_class).to respond_to(:call)
    end
  end

  describe "#compute_due_dates_and_create_submissions" do
    let(:peer_review_sub_assignment) do
      PeerReviewSubAssignment.create!(
        parent_assignment:,
        context: course,
        title: "Test Peer Review"
      )
    end

    before do
      allow(PeerReviewSubAssignment).to receive(:clear_cache_keys)
      allow(SubmissionLifecycleManager).to receive(:recompute)
    end

    it "clears cache keys for the peer review sub assignment" do
      expect(PeerReviewSubAssignment).to receive(:clear_cache_keys)
        .with(peer_review_sub_assignment, :availability)

      service.send(:compute_due_dates_and_create_submissions, peer_review_sub_assignment)
    end

    it "calls SubmissionLifecycleManager.recompute with correct parameters" do
      expect(SubmissionLifecycleManager).to receive(:recompute)
        .with(peer_review_sub_assignment, update_grades: true, create_sub_assignment_submissions: false)

      service.send(:compute_due_dates_and_create_submissions, peer_review_sub_assignment)
    end

    it "handles the method being called with a nil peer review sub assignment" do
      expect(PeerReviewSubAssignment).to receive(:clear_cache_keys)
        .with(nil, :availability)
      expect(SubmissionLifecycleManager).to receive(:recompute)
        .with(nil, update_grades: true, create_sub_assignment_submissions: false)

      expect { service.send(:compute_due_dates_and_create_submissions, nil) }.not_to raise_error
    end
  end

  describe "translations" do
    it "translates error messages" do
      service.instance_variable_set(:@parent_assignment, nil)
      expect(I18n).to receive(:t).with("Invalid parent assignment").and_return("Translated invalid parent assignment")

      expect { service.send(:validate_parent_assignment) }.to raise_error(
        PeerReview::PeerReviewInvalidParentAssignmentError,
        "Translated invalid parent assignment"
      )
    end
  end
end
