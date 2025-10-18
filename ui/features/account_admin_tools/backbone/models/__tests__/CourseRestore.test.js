/*
 * Copyright (C) 2013 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import CourseRestoreModel from '../CourseRestore'
import $ from 'jquery'
import 'jquery-migrate'
import {http, HttpResponse} from 'msw'
import {setupServer} from 'msw/node'
import fakeENV from '@canvas/test-utils/fakeENV'

const fixturesDiv = document.createElement('div')
fixturesDiv.id = 'fixtures'
document.body.appendChild(fixturesDiv)

let account_id
let course_id
let courseRestore

const server = setupServer()

const progressCompletedJSON = {
  completion: 0,
  context_id: 4,
  context_type: 'Account',
  created_at: '2013-03-08T16:37:46-07:00',
  id: 28,
  message: null,
  tag: 'course_batch_update',
  updated_at: '2013-03-08T16:37:46-07:00',
  url: 'http://localhost:3000/api/v1/progress/28',
  user_id: 51,
  workflow_state: 'completed',
}
const progressQueuedJSON = {
  completion: 0,
  context_id: 4,
  context_type: 'Account',
  created_at: '2013-03-08T16:37:46-07:00',
  id: 28,
  message: null,
  tag: 'course_batch_update',
  updated_at: '2013-03-08T16:37:46-07:00',
  url: 'http://localhost:3000/api/v1/progress/28',
  user_id: 51,
  workflow_state: 'queued',
}
const courseJSON = {
  account_id: 6,
  course_code: 'Super',
  default_view: 'feed',
  end_at: null,
  enrollments: [],
  hide_final_grades: false,
  id: 58,
  name: 'Super Fun Deleted Course',
  sis_course_id: null,
  start_at: null,
  workflow_state: 'deleted',
}

describe('CourseRestore', () => {
  beforeAll(() => {
    server.listen({onUnhandledRequest: 'error'})
  })

  afterEach(() => {
    server.resetHandlers()
    fakeENV.teardown()
    $('#fixtures').empty()
    jest.useRealTimers()
  })

  afterAll(() => server.close())

  beforeEach(() => {
    fakeENV.setup()
    account_id = 4
    course_id = 42
    courseRestore = new CourseRestoreModel({account_id})
    jest.useFakeTimers()
    $('#fixtures').append($('<div id="flash_screenreader_holder" />'))

    // Set up default handlers for all tests
    server.use(
      // Default handler for search requests
      http.get('*/api/v1/accounts/*/courses/*', () => {
        return new HttpResponse(null, {status: 404})
      }),
      // Default handler for restore requests
      http.put('*/api/v1/accounts/*/courses/', () => {
        return new HttpResponse(null, {status: 400})
      }),
      // Default handler for progress requests
      http.get('*/api/v1/progress/*', () => {
        return HttpResponse.json(progressCompletedJSON)
      }),
    )
  })
  test("triggers 'searching' when search is called", function () {
    const callback = jest.fn()
    courseRestore.on('searching', callback)
    courseRestore.search(account_id)
    expect(callback).toHaveBeenCalled()
  })

  test('populates CourseRestore model with response, keeping its original account_id', function (done) {
    server.use(http.get('*/api/v1/accounts/*/courses/*', () => HttpResponse.json(courseJSON)))

    courseRestore.on('doneSearching', () => {
      expect(courseRestore.get('account_id')).toBe(account_id)
      expect(courseRestore.get('id')).toBe(courseJSON.id)
      done()
    })

    courseRestore.search(course_id)
  })

  test('set status when course not found', function (done) {
    server.use(
      http.get('*/api/v1/accounts/*/courses/*', () => {
        return new HttpResponse('{}', {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }),
    )

    courseRestore.on('doneSearching', () => {
      expect(courseRestore.get('status')).toBe(404)
      done()
    })

    courseRestore.search('a')
  })

  test('responds with a deferred object', function () {
    const dfd = courseRestore.restore()
    expect($.isFunction(dfd.done)).toBeTruthy()
  })

  test('restores a course after search finds a deleted course', function (done) {
    jest.useRealTimers() // Use real timers for this test

    // Set up handlers with proper URL patterns to catch all requests
    server.use(
      // Handle search requests
      http.get('*/api/v1/accounts/*/courses/*', ({request}) => {
        const url = new URL(request.url)
        if (url.searchParams.get('include[]') === 'all_courses') {
          return HttpResponse.json(courseJSON)
        }
        return new HttpResponse(null, {status: 404})
      }),
      // Handle restore requests
      http.put('*/api/v1/accounts/*/courses/', ({request}) => {
        const url = new URL(request.url)
        if (url.searchParams.get('event') === 'undelete' && url.searchParams.get('course_ids[]')) {
          return HttpResponse.json(progressQueuedJSON)
        }
        return new HttpResponse(null, {status: 400})
      }),
      // Handle progress polling
      http.get('*/api/v1/progress/*', () => {
        return HttpResponse.json(progressCompletedJSON)
      }),
      // Catch any localhost progress URLs
      http.get('http://localhost:3000/api/v1/progress/*', () => {
        return HttpResponse.json(progressCompletedJSON)
      }),
    )

    // First do the search
    courseRestore.search(course_id)

    // Wait for search to complete
    courseRestore.on('doneSearching', () => {
      // Verify search worked
      expect(courseRestore.get('id')).toBe(courseJSON.id)

      // Now do the restore
      const dfd = courseRestore.restore()

      // Check state changes
      courseRestore.on('doneRestoring', () => {
        expect(courseRestore.get('workflow_state')).toBe('unpublished')
        expect(courseRestore.get('restored')).toBe(true)
        // The deferred should be resolved after this event
        setTimeout(() => {
          expect(dfd.state()).toBe('resolved')
          done()
        }, 0)
      })
    })
  })
})
