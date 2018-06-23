#!/usr/bin/env node
require('dotenv').config();
const rp = require('request-promise');
const cheerio = require('cheerio');
const assert = require('assert');

const USER_AGENT = 'Robot; wgoodall01@gmail.com';
const BASE_URL = 'https://turnitin.com';

const swallowErrors = async prom => {
  try {
    return await prom;
  } catch (e) {
    return e;
  }
};

function parseDate({date, time, tz}) {
  return new Date(`${date} ${time.replace(/([A-Z])M$/, ' $1M')} ${tz}`);
}

async function login(email, password, ctx) {
  const options = {
    method: 'POST',
    uri: `${BASE_URL}/login_page.asp?lang=en_us`,
    form: {
      submit: 'Login',
      javascript_enabled: '0',
      email: email,
      user_password: password
    },
    jar: ctx.cookieJar,
    headers: {'User-Agent': USER_AGENT},
    followRedirect: true,
    followAllRedirects: true,
    maxRedirects: 2,
    resolveWithFullResponse: true
  };

  // Log in to turnitin
  const loginResp = await swallowErrors(rp(options));
  const loginRespBody = cheerio.load(loginResp.body);
  const status = loginResp.statusCode;
  assert(loginRespBody('#ibox_form .error').length == 0, 'turnitin login error');
  assert(status === 200, 'response status is not 200');
  const hasSession =
    ctx.cookieJar.getCookies(BASE_URL).filter(e => e.key === 'session-id').length === 1;
  assert(hasSession, 'must be cookied with session-id');
}

async function getCourseList(ctx) {
  const options = {
    method: 'GET',
    uri: `${BASE_URL}/s_home.asp`,
    jar: ctx.cookieJar,
    followRedirect: true,
    followAllRedirects: true,
    maxRedirects: 10,
    transform: body => cheerio.load(body)
  };

  const listPage = await rp(options);

  const courses = [];
  listPage('.ibox_body_wrapper table tbody tr')
    .slice(1)
    .each((i, e) => {
      const getInfo = cls =>
        listPage(e)
          .find(cls)
          .text();

      courses.push({
        id: getInfo('.class_id'),
        name: getInfo('.class_name'),
        instructor: getInfo('.class_instructor'),
        status: getInfo('.class_status'),
        url: listPage(e)
          .find('.class_name a')
          .attr('href'),
        assignments: []
      });
    });

  return courses;
}

async function getGrades(url, ctx) {
  const options = {
    method: 'GET',
    uri: `${BASE_URL}/${url}`,
    jar: ctx.cookieJar,
    transform: body => cheerio.load(body)
  };

  const gradesPage = await rp(options);

  const grades = [];

  gradesPage('.ibox .ibox_body_wrapper .inbox_table tbody tr')
    .slice(1)
    .each((i, e) => {
      const getInfo = cls =>
        gradesPage(e)
          .find(cls)
          .text();

      grades[i] = {
        points: parseFloat(getInfo('._assignment_points')) || null,
        total: parseFloat(getInfo('._assignment_maxpoints').replace(/[()]/g, '')),
        submissionTitle: getInfo('._submission_title') || null
      };
    });

  return grades;
}

async function getAssignments(url, ctx) {
  const options = {
    method: 'GET',
    uri: `${BASE_URL}/${url}`,
    jar: ctx.cookieJar,
    transform: body => cheerio.load(body)
  };

  const coursePage = await rp(options);

  const assignments = [];

  // Get the assignment infos
  coursePage('#student_assignment_table>tbody>tr')
    .not('.col-heading')
    .each((i, e) => {
      const getInfo = cls =>
        coursePage(e)
          .find(cls)
          .text()
          .trim();

      const isGraded = coursePage(e).find('.btn.view-btn.btn-primary').length == 1;

      assignments[i] = {
        id: coursePage(e)
          .attr('id')
          .replace('assignment_', ''),
        name: getInfo('.assignment-title'),
        similarity: parseFloat(getInfo('.similarity .or-percentage').replace('%', '')) || null,
        isGraded,
        start: parseDate({
          tz: ctx.tz,
          date: getInfo('.dates .date.start-date'),
          time: getInfo('.dates .time.start-time')
        }),
        due: parseDate({
          tz: ctx.tz,
          date: getInfo('.dates .date.due-date'),
          time: getInfo('.dates .time.due-time')
        }),
        post: parseDate({
          tz: ctx.tz,
          date: getInfo('.dates .date.post-date'),
          time: getInfo('.dates .time.post-time')
        })
      };
    });

  // Get the assignments' grades
  const gradesUrl = coursePage('#tabs ul li a:contains("Grades")').attr('href');

  // Fetch and merge grades/assignments
  const grades = await getGrades(gradesUrl, ctx);
  assert(grades.length === assignments.length, "Grades and assignments list don't match. Retry?");
  for (let i = 0; i < assignments.length; i++) {
    Object.assign(assignments[i], grades[i]);
  }

  return assignments;
}

async function fetch({email, password, tz, status}) {
  const ctx = {
    cookieJar: rp.jar(),
    tz,
    status: status || (() => {}) // Called with some text regularly.
  };

  // Log in to turnitin
  ctx.status(`Logging in to '${email}'`);
  await login(email, password, ctx);

  // Get list of courses
  ctx.status(`Getting list of courses`);
  let courses = await getCourseList(ctx);

  // Fetch each course's assignments...
  for (let course of courses) {
    ctx.status(`Getting '${course.name}'`);
    course.assignments = await getAssignments(course.url, ctx);
  }

  ctx.status('Done!');
  return courses;
}

module.exports = {
  fetch
};
