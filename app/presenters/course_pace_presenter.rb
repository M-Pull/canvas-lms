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

class CoursePacePresenter
  include Rails.application.routes.url_helpers

  attr_reader :course_pace, :enrollment

  def initialize(course_pace)
    @course_pace = course_pace
  end

  DATE_FORMAT = "%m/%d/%Y"
  TEMPLATE_PATH = "app/presenters/course_pacing/templates"

  def as_json
    {
      id: course_pace.id,
      course_id: course_pace.course_id,
      course_section_id: course_pace.course_section_id,
      user_id: course_pace.user_id,
      workflow_state: course_pace.workflow_state,
      exclude_weekends: course_pace.weekends_excluded,
      selected_days_to_skip: course_pace.selected_days_to_skip,
      hard_end_dates: course_pace.hard_end_dates,
      created_at: course_pace.created_at,
      updated_at: course_pace.updated_at,
      published_at: course_pace.published_at,
      root_account_id: course_pace.root_account_id,
      modules: modules_json,
      context_id:,
      context_type:
    }.merge(course_pace.start_date(with_context: true)).merge(course_pace.effective_end_date(with_context: true))
  end

  def as_docx(pace_context)
    if pace_context.is_a? Enrollment
      @enrollment = pace_context
    end
    doc = case pace_context
          when Course
            Docx::Document.open("#{TEMPLATE_PATH}/DefaultCoursePace.docx")
          when CourseSection
            Docx::Document.open("#{TEMPLATE_PATH}/SectionCoursePace.docx")
          when Enrollment
            Docx::Document.open("#{TEMPLATE_PATH}/IndividualCoursePace.docx")
          end

    enrollment_start_date = enrollment&.start_at || [enrollment&.effective_start_at, enrollment&.created_at].compact.max
    start_date = enrollment_start_date&.to_date || course_pace.start_date.to_date
    docx_replace(doc, "[Course Name]", course_pace.course.name)

    if pace_context.is_a? Enrollment
      docx_replace(doc, "[Student Name]", pace_context.user.name)
      docx_replace(doc, "[On Pace/ Off Pace]", "TODO")
    elsif pace_context.is_a? CourseSection
      docx_replace(doc, "[Section Name]", pace_context.name)
      docx_replace(doc, "[x] students in this section", "#{pace_context.students.count} students in this section")
    end

    docx_replace(doc, "[MM/DD/YYYY] Start Date", "#{start_date.strftime(DATE_FORMAT)} Start Date")
    docx_replace(doc, "[MM/DD/YYYY] End Date", "#{planned_end_date.strftime(DATE_FORMAT)} End Date")
    docx_replace(doc, "[x] Assignments", "#{course_pace.course_pace_module_items.count} Assignments")

    duration = (planned_end_date - start_date).to_i
    docx_replace(doc, "[x] weeks, [x] days", "#{duration / 7} weeks, #{duration % 7} days")

    add_docx_tables(doc)

    doc.stream
  end

  private

  def add_docx_tables(doc)
    module_table_template = doc.tables.first
    course_table_template = doc.tables.last

    module_tables = course_pace_module_items.map do |context_module, items|
      make_module_table(context_module, items, module_table_template)
    end

    course_table = make_course_table(course_table_template)

    insert_after_point = course_table_template
    module_tables.each do |module_table|
      module_table.insert_after(insert_after_point)
      p = module_table.rows.last.cells.last.paragraphs.last.copy
      p.blank!
      p.insert_after(module_table)
      insert_after_point = p
    end

    course_table.insert_after(insert_after_point)

    module_table_template.remove!
    course_table_template.remove!
  end

  def make_module_table(context_module, items, module_table_template)
    table = module_table_template.copy

    module_descriptor_row = table.rows.first
    docx_replace(module_descriptor_row.cells[0], "[Module Name]", context_module.name)

    assignment_descriptor_template = table.rows.last.copy
    table.rows.last.remove!

    items.each do |ppmi|
      module_item = ppmi.module_item
      item_row = assignment_descriptor_template.copy
      item_row.cells.each_with_index do |cell, idx|
        case idx
        when 0
          docx_replace(cell, "[Assignment Name]", module_item.title + " ")
          case module_item.content_type
          when "Assignment", "Quizzes::Quiz"
            points = TextHelper.round_if_whole(module_item&.content&.points_possible)
            docx_replace(cell, "[x] Points", "#{points} #{"Point".pluralize(points)}")
          when "Page"
            docx_replace(cell, "[x] Points", "View")
          end
        when 1
          docx_replace(cell, "[X]", ppmi.duration.to_s)
        when 2
          docx_replace(cell, "MM/DD/YYYY", due_dates[ppmi.id].strftime(DATE_FORMAT))
        when 3
          docx_replace(cell, "[published/ unpublished]", module_item.content.published? ? "Published" : "Unpublished")
        end
      end
      item_row.insert_after(table.rows.last)
    end

    table
  end

  def make_course_table(course_table_template)
    table = course_table_template.copy
    table.rows.last.remove!
    blackout_template = table.rows.first

    blackout_dates = due_dates_calculator.blackout_dates

    blackout_dates.each do |blackout_date|
      row = blackout_template.copy

      docx_replace(row.cells.first, "Black Out Dates", "Black Out Dates: #{blackout_date.title}")
      docx_replace(row.cells.last, "MM/DD/YYYY", "#{blackout_date.start_at.strftime(DATE_FORMAT)}-#{blackout_date.end_at.strftime(DATE_FORMAT)}")

      row.insert_before(blackout_template)
    end

    skipped_dates_row = blackout_template.copy

    docx_replace(skipped_dates_row.cells.first, "Black Out Dates", "Skipped Dates")
    docx_replace(skipped_dates_row.cells.last, "MM/DD/YYYY", course_pace.selected_days_to_skip.map(&:capitalize).join("/"))

    skipped_dates_row.insert_before(blackout_template)

    blackout_template.remove!

    table
  end

  def modules_json
    course_pace_module_items.map do |context_module, items|
      {
        id: context_module.id,
        name: context_module.name,
        position: context_module.position,
        items: items_json(items),
      }
    end
  end

  def items_json(items)
    return [] unless items

    module_item_ids = extract_module_item_ids(items)
    content_tags = load_and_assign_content_tags(module_item_ids)
    submission_statuses = course_pace.module_item_submission_status_by_student([course_pace.user_id], module_item_ids)

    build_items_json(items, content_tags, submission_statuses)
  end

  def extract_module_item_ids(items)
    items.map { |ppmi| ppmi.module_item.id }
  end

  def load_and_assign_content_tags(module_item_ids)
    content_tags = ContentTag.where(id: module_item_ids)
    assignment_content_ids = content_tags.select { |tag| tag.content_type == "Assignment" }.map(&:content_id)
    assignments = Assignment.where(id: assignment_content_ids).index_by(&:id)
    content_tags.each { |tag| tag.content = assignments[tag.content_id] if tag.content_type == "Assignment" }
    content_tags
  end

  def build_items_json(items, content_tags, submission_statuses)
    items.map do |ppmi|
      module_item = ppmi.module_item
      submission_status = submission_statuses[course_pace.user_id][module_item.id] || { has_submission: false, submission_date: nil, submittable: false }
      content = content_tags.find { |tag| tag.id == module_item.id }&.content
      {
        id: ppmi.id,
        duration: ppmi.duration,
        course_pace_id: ppmi.course_pace_id,
        root_account_id: ppmi.root_account_id,
        module_item_id: module_item.id,
        assignment_title: module_item.title,
        points_possible: TextHelper.round_if_whole(content&.try_rescue(:points_possible)),
        assignment_link: "#{course_url(course_pace.course, only_path: true)}/modules/items/#{module_item.id}",
        position: module_item.position,
        module_item_type: module_item.content_type,
        published: module_item.published?,
        submitted_at: submission_status[:submission_date],
        submittable: submission_status[:submittable]
      }
    end
  end

  def context_id
    course_pace.user_id || course_pace.course_section_id || course_pace.course_id
  end

  def context_type
    if course_pace.user_id
      "Enrollment"
    elsif course_pace.course_section_id
      "Section"
    else
      "Course"
    end
  end

  def course_pace_module_items
    @course_pace_module_items ||= begin
      items = if course_pace.persisted?
                course_pace.course_pace_module_items
                           .joins(:module_item)
                           .preload(module_item: [:context_module])
                           .order("content_tags.position ASC")
              else
                course_pace.course_pace_module_items
              end

      module_item_ids = items.filter_map(&:module_item_id).uniq
      module_items = ContentTag.where(id: module_item_ids).preload(:context_module, :content).index_by(&:id)

      items.each do |ppmi|
        ppmi.module_item = module_items[ppmi.module_item_id]
      end

      items.group_by { |ppmi| ppmi.module_item.context_module }
           .sort_by { |context_module, _items| context_module&.position || Float::INFINITY }
    end
  end

  def due_dates_calculator
    @due_dates_calculator ||= CoursePaceDueDatesCalculator.new(course_pace)
  end

  def due_dates
    @due_dates ||= due_dates_calculator.get_due_dates(course_pace_module_items.to_h.values.flatten, enrollment)
  end

  def planned_end_date
    @planned_end_date ||= due_dates.values.last
  end

  def docx_replace(doc, matcher, replace_with)
    doc.paragraphs.each do |p|
      p.each_text_run do |tr|
        tr.substitute(matcher, replace_with)
      end
    end
  end
end
