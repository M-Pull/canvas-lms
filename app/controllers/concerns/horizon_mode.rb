# frozen_string_literal: true

#
# Copyright (C) 2021 - present Instructure, Inc.
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

module HorizonMode
  def horizon_course?
    @context.is_a?(Course) && @context.horizon_course?
  end

  def horizon_student?
    !(@context.user_is_admin?(@current_user) || @context.cached_account_users_for(@current_user).any?)
  end

  def horizon_admin?
    @context.grants_right?(@current_user, :read_as_admin)
  end

  # Use this function after @context is set
  def load_canvas_career_for_student
    return if params[:invitation].present?
    return unless horizon_course?
    return unless horizon_student?

    redirect_url = @context.root_account.horizon_redirect_url(request.path)
    return if redirect_url.nil?

    redirect_to redirect_url
  end

  # Use this function after @context is set
  def load_canvas_career_for_provider
    return unless canvas_career_learning_provider_app_enabled?

    session[:career_course_id] = @context.id

    redirect_to "/career"
  end

  # Use this function after @context is set
  # Combines both student and provider career loading in one method
  def load_canvas_career
    # First try student path
    load_canvas_career_for_student
    # If no redirect happened, try provider path
    load_canvas_career_for_provider unless performed?
  end

  def canvas_career_learning_provider_app_launch_url
    uri = @context.root_account.horizon_url("learning-provider/remoteEntry.js")
    uri.to_s
  end

  def canvas_career_learning_provider_app_enabled?
    return false unless horizon_course?
    return false unless horizon_admin?
    return false if canvas_career_learning_provider_app_launch_url.blank?
    return false unless Account.site_admin.feature_enabled?(:horizon_learning_provider_app)

    true
  end

  def load_canvas_career_learning_provider_app
    return unless canvas_career_learning_provider_app_enabled?

    remote_env(canvascareer: canvas_career_learning_provider_app_launch_url)
    deferred_js_bundle :canvas_career
  end
end
