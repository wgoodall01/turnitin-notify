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

async function login(cookieJar, email, password) {
  const options = {
    method: 'POST',
    uri: `${BASE_URL}/login_page.asp?lang=en_us`,
    form: {
      email: email,
      user_password: password
    },
    jar: cookieJar,
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
    cookieJar.getCookies(BASE_URL).filter(e => e.key === 'session-id').length === 1;
  assert(hasSession, 'must be cookied with session-id');
}

async function getCourseList(cookieJar) {
  const options = {
    method: 'GET',
    uri: `${BASE_URL}/s_home.asp`,
    jar: cookieJar,
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

async function getGrades(cookieJar, url) {
  const options = {
    method: 'GET',
    uri: `${BASE_URL}/${url}`,
    jar: cookieJar,
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
        submissionTitle: getInfo('._submission_title')
      };
    });

  return grades;
}

async function getAssignments(cookieJar, url) {
  const options = {
    method: 'GET',
    uri: `${BASE_URL}/${url}`,
    jar: cookieJar,
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
          .text();

      const isGraded = coursePage(e).find('.btn.view-btn.btn-primary').length == 1;

      assignments[i] = {
        id: coursePage(e)
          .attr('id')
          .replace('assignment_', ''),
        name: getInfo('.assignment-title'),
        similarity: parseFloat(getInfo('.similarity .or-percentage').replace('%', '')) || null,
        isGraded,
        start: {
          date: getInfo('.dates .date.start-date'),
          time: getInfo('.dates .time.start-time')
        },
        due: {date: getInfo('.dates .date.due-date'), time: getInfo('.dates .time.due-time')},
        post: {date: getInfo('.dates .date.post-date'), time: getInfo('.dates .time.post-time')}
      };
    });

  // Get the assignments' grades
  const gradesUrl = coursePage('#tabs ul li a')
    .slice(2)
    .attr('href');

  // Fetch and merge grades/assignments
  const grades = await getGrades(cookieJar, gradesUrl);
  for (let i = 0; i < assignments.length; i++) {
    Object.assign(assignments[i], grades[i]);
  }

  return assignments;
}

async function fetch(email, password) {
  const cookieJar = rp.jar();

  // Log in to turnitin
  await login(cookieJar, email, password);

  // Get list of courses
  let courses = await getCourseList(cookieJar);

  // Fetch each course's assignments...
  for (let course of courses) {
    course.assignments = await getAssignments(cookieJar, course.url);
  }

  return courses;
}

module.exports = {
  fetch,
  login,
  getCourseList,
  getGrades,
  getAssignments
};
