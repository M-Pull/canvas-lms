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

module Lti
  # This module is responsible for notifying all relevant Asset Processors of a new submission.
  module AssetProcessorNotifier
    module_function

    class MissingGroupmateSubmissionError < StandardError; end

    def notify_asset_processors(submission, asset_processor = nil, tool_id = nil)
      return unless submission.asset_processor_compatible?

      asset_processors = submission.assignment.lti_asset_processors
      if asset_processor.present?
        asset_processors = asset_processors.where(id: asset_processor.id)
      end
      if tool_id.present?
        asset_processors = asset_processors.where(context_external_tool_id: tool_id)
      end
      return if asset_processors.empty?

      lti_assets = if submission.text_entry_submission?
                     [Lti::Asset.find_or_create_by!(submission_attempt: submission.attempt, submission:)]
                   else
                     submission.versioned_attachments.map do |attachment|
                       Lti::Asset.find_or_create_by!(attachment:, submission:)
                     end
                   end
      return if lti_assets.empty?

      lti_assets.each(&:calculate_sha256_checksum!)
      asset_processors.each do |ap|
        params = notice_params(submission, lti_assets, ap)
        builder = Pns::LtiAssetProcessorSubmissionNoticeBuilder.new(params)
        Lti::PlatformNotificationService.notify_tools(cet_id_or_ids: ap.context_external_tool_id, builders: [builder])
      end
    end

    def get_original_submission_for_group(submission)
      attempt = submission.attempt || 0
      if submission.real_submitter_id.present?
        if submission.user_id == submission.real_submitter_id
          return submission
        else
          submission_to_notify = Submission.active.where(
            assignment_id: submission.assignment_id,
            group_id: submission.group_id,
            user_id: submission.real_submitter_id
          ).first
          if submission_to_notify && attempt.positive? && submission_to_notify.attempt != attempt
            submission_to_notify = submission_to_notify.versions.find { |s| s.model.attempt == attempt }&.model
          end
          return submission_to_notify if submission_to_notify
        end
      end

      # If we are dealing with special edge cases like submissions before real_submitter_id was implemented
      # or user have been deleted from group, or group changes, we try to find the original submitter based on already created Asset records.
      groupmate_submission_ids = Submission.active.where(group_id: submission.group_id, assignment_id: submission.assignment_id).pluck(:id)
      if submission.text_entry_submission?
        asset = Lti::Asset.where(submission_attempt: submission.attempt, submission_id: groupmate_submission_ids).first
        submission_to_notify = asset.submission if asset
      elsif submission.attachments.first.present?
        asset = Lti::Asset.where(attachment_id: submission.attachments.first.id, submission_id: groupmate_submission_ids).first
        submission_to_notify = asset.submission if asset
      end
      if submission_to_notify && attempt.positive? && submission_to_notify.attempt != attempt
        submission_to_notify = submission_to_notify.versions.find { |s| s.model.attempt == attempt }&.model
      end
      return submission_to_notify if submission_to_notify

      raise MissingGroupmateSubmissionError, "Missing groupmate submission for #{submission.id} real_submitter_id: #{submission.real_submitter_id}"
    end

    def notice_params(submission, assets, asset_processor)
      {
        assignment: submission.assignment,
        asset_report_service_url: asset_report_service_url(asset_processor),
        assets: assets.map { |asset| asset_hash(submission, asset, asset_processor) },
        custom: asset_processor.custom || {},
        for_user_id: submission.user.lti_id,
        notice_event_timestamp: Time.now.utc.iso8601,
        submission_lti_id: submission.lti_attempt_id,
        user: submission.user,
      }
    end
    private_class_method :notice_params

    def asset_hash(submission, asset, asset_processor)
      hash = {
        asset_id: asset.uuid,
        sha256_checksum: asset.sha256_checksum,
        size: asset.content_size,
        url: asset_url(asset_processor, asset),
        title: submission.assignment.title,
        content_type: asset.content_type
      }
      if submission.text_entry_submission?
        hash[:timestamp] = submission.submitted_at.iso8601
        # filename is optional and we don't have name in canvas for text entry,
      else
        hash[:timestamp] = asset.attachment.modified_at.iso8601
        hash[:filename] = asset.attachment.display_name
      end
      hash
    end
    private_class_method :asset_hash

    def asset_url(asset_processor, asset)
      Rails.application.routes.url_helpers.lti_asset_processor_asset_show_url(
        asset_processor_id: asset_processor.id,
        asset_id: asset.uuid,
        host: asset_processor.root_account.environment_specific_domain
      )
    end
    private_class_method :asset_url

    def asset_report_service_url(asset_processor)
      Rails.application.routes.url_helpers.lti_asset_processor_create_report_url(
        host: asset_processor.root_account.environment_specific_domain,
        asset_processor_id: asset_processor.id
      )
    end
    private_class_method :asset_report_service_url
  end
end
