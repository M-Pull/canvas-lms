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

require_relative "../graphql_spec_helper"

describe Types::SubmissionStatisticsType do
  around do |example|
    # Freeze time to avoid timebombs
    Timecop.freeze(Time.zone.parse("2025-01-15 12:00:00")) do
      example.run
    end
  end

  before(:once) do
    course_with_student(active_all: true)
    # Time is frozen to 2025-01-15 12:00:00 (Wednesday at noon)
    @now = Time.zone.now

    # Create assignments with different due dates and submission states
    @assignment_due_today = @course.assignments.create!(
      name: "Due Today",
      submission_types: "online_text_entry",
      points_possible: 10,
      due_at: @now + 6.hours # Same day, later (6 PM)
    )

    @assignment_due_tomorrow = @course.assignments.create!(
      name: "Due Tomorrow",
      submission_types: "online_text_entry",
      points_possible: 10,
      due_at: @now + 1.day + 6.hours # Next day (Thursday 6 PM)
    )

    @assignment_overdue = @course.assignments.create!(
      name: "Overdue",
      submission_types: "online_text_entry",
      points_possible: 10,
      due_at: @now - 2.days # Two days ago (Monday)
    )

    @assignment_due_next_week = @course.assignments.create!(
      name: "Due Next Week",
      submission_types: "online_text_entry",
      points_possible: 10,
      due_at: @now + 8.days # Next week (Thursday)
    )

    # Create submissions with different states
    @submission_submitted = @assignment_due_today.submit_homework(@student, submission_type: "online_text_entry", body: "My submission")
    @submission_graded = @assignment_due_tomorrow.grade_student(@student, score: 8, grader: @teacher).first
    @submission_missing = @assignment_overdue.find_or_create_submission(@student)
    @submission_missing.update!(late_policy_status: "missing")

    # Create unsubmitted assignment for next week
    @assignment_due_next_week.find_or_create_submission(@student)
  end

  let(:course_type) { GraphQLTypeTester.new(@course, current_user: @student) }

  describe "original fields" do
    describe "submissions_due_this_week_count" do
      it "counts submissions due within the next 7 days" do
        # Only counts unsubmitted assignments due in next 7 days
        # assignment_due_today and assignment_due_tomorrow are submitted/graded
        # assignment_due_next_week (8 days) is outside the 7-day window
        expect(course_type.resolve("submissionStatistics { submissionsDueThisWeekCount }")).to eq 0
      end

      it "returns 0 when current_user is nil" do
        course_type_no_user = GraphQLTypeTester.new(@course, current_user: nil)
        expect(course_type_no_user.resolve("submissionStatistics { submissionsDueThisWeekCount }")).to be_nil
      end

      it "verifies the 7-day window calculation" do
        # assignment_due_next_week is 8 days out (outside 7-day window)
        # assignment_due_today and assignment_due_tomorrow are submitted/graded
        # So we should expect 0 for the base case
        result = course_type.resolve("submissionStatistics { submissionsDueThisWeekCount }")
        expect(result).to eq 0
      end
    end

    describe "missing_submissions_count" do
      it "counts missing submissions" do
        expect(course_type.resolve("submissionStatistics { missingSubmissionsCount }")).to eq 1
      end
    end

    describe "submitted_submissions_count" do
      it "counts submitted, graded, and excused submissions" do
        expect(course_type.resolve("submissionStatistics { submittedSubmissionsCount }")).to eq 2
      end
    end
  end

  describe "date-filtered fields" do
    let(:today) { @now.beginning_of_day }
    let(:tomorrow) { (today + 1.day).end_of_day }
    let(:next_week_start) { today + 7.days }
    let(:next_week_end) { today + 14.days }

    describe "submissions_due_count with date filtering" do
      it "counts assignments due in the specified date range that are not submitted" do
        result = course_type.resolve(
          "submissionStatistics { submissionsDueCount(startDate: \"#{today.iso8601}\", endDate: \"#{tomorrow.iso8601}\") }"
        )
        # Both assignments in range (due_today and due_tomorrow) are submitted/graded
        # so they should not count as "due" (meaning unsubmitted)
        expect(result).to eq 0
      end

      it "returns 0 when no assignments are due in the date range" do
        far_future = today + 30.days
        far_future_end = far_future + 1.day
        result = course_type.resolve(
          "submissionStatistics { submissionsDueCount(startDate: \"#{far_future.iso8601}\", endDate: \"#{far_future_end.iso8601}\") }"
        )
        expect(result).to eq 0
      end

      it "counts assignments due next week" do
        result = course_type.resolve(
          "submissionStatistics { submissionsDueCount(startDate: \"#{next_week_start.iso8601}\", endDate: \"#{next_week_end.iso8601}\") }"
        )
        expect(result).to eq 1 # The assignment_due_next_week
      end

      it "works without date parameters" do
        result = course_type.resolve("submissionStatistics { submissionsDueCount }")
        # Should count assignment_due_next_week (8 days out, unsubmitted, future)
        # Other assignments are either submitted/graded or past due (overdue/missing)
        expect(result).to eq 1 # just assignment_due_next_week
      end
    end

    describe "submissions_overdue_count with date filtering" do
      it "returns 0 when no assignments are overdue in the date range" do
        # Test with a future date range where nothing should be overdue
        far_future = today + 30.days
        far_future_end = far_future + 1.day
        result = course_type.resolve(
          "submissionStatistics { submissionsOverdueCount(startDate: \"#{far_future.iso8601}\", endDate: \"#{far_future_end.iso8601}\") }"
        )
        expect(result).to eq 0 # No overdue assignments in this future range
      end

      it "handles overdue logic with missing status" do
        monday_range = (today - 3.days).beginning_of_day
        tuesday_range = (today - 2.days).end_of_day
        result = course_type.resolve(
          "submissionStatistics { submissionsOverdueCount(startDate: \"#{monday_range.iso8601}\", endDate: \"#{tuesday_range.iso8601}\") }"
        )
        expect(result).to eq 0 # Missing assignments don't count as overdue
      end
    end

    describe "submissions_submitted_count with date filtering" do
      it "counts submitted assignments in the specified date range" do
        skip "Very flaky in Jenkins, needs investigation FOO-5719"
        result = course_type.resolve(
          "submissionStatistics { submissionsSubmittedCount(startDate: \"#{today.iso8601}\", endDate: \"#{tomorrow.iso8601}\") }"
        )
        expect(result).to eq 2 # Both assignments in range are submitted/graded
      end

      it "returns 0 when no assignments are submitted in the date range" do
        far_past = today - 30.days
        far_past_end = far_past + 1.day
        result = course_type.resolve(
          "submissionStatistics { submissionsSubmittedCount(startDate: \"#{far_past.iso8601}\", endDate: \"#{far_past_end.iso8601}\") }"
        )
        expect(result).to eq 0
      end
    end
  end

  describe "edge cases" do
    let(:today) { @now.beginning_of_day }
    let(:tomorrow) { (today + 1.day).end_of_day }

    it "handles submissions without due dates" do
      assignment_no_due_date = @course.assignments.create!(
        name: "No Due Date",
        submission_types: "online_text_entry",
        points_possible: 10
      )
      assignment_no_due_date.find_or_create_submission(@student)

      # Assignments without due dates should not be counted in date-filtered queries
      result = course_type.resolve(
        "submissionStatistics { submissionsDueCount(startDate: \"#{today.iso8601}\", endDate: \"#{tomorrow.iso8601}\") }"
      )
      # Still should be 0 because the assignments with due dates in this range are submitted/graded
      # and the new assignment without due date is excluded from date filtering
      expect(result).to eq 0
    end

    it "handles excused submissions" do
      @submission_missing.update!(excused: true)

      result = course_type.resolve("submissionStatistics { submittedSubmissionsCount }")
      expect(result).to eq 3 # Now includes the excused submission

      result = course_type.resolve("submissionStatistics { missingSubmissionsCount }")
      expect(result).to eq 0 # Excused submissions are not missing
    end
  end
end
