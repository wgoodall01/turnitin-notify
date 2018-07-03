const omit = require('lodash/omit');

const compareDates = (a, b) => a.date === b.date && a.time === b.time;

function compareAssignments(pair) {
  const differences = [];
  if (pair.new && !pair.old) {
    differences.push({type: 'new_assignment', pair});
  } else if (pair.old && !pair.new) {
    differences.push({type: 'removed_assignment', pair});
  } else {
    if (pair.new.isGraded && !pair.old.isGraded) {
      differences.push({type: 'graded_assignment', pair});
    }

    if (!compareDates(pair.new.start, pair.old.start)) {
      differences.push({type: 'change_start', pair});
    }
    if (!compareDates(pair.new.due, pair.old.due)) {
      differences.push({type: 'change_due', pair});
    }
    if (!compareDates(pair.new.post, pair.old.post)) {
      differences.push({type: 'change_post', pair});
    }
  }
  return differences;
}

function byId(pair) {
  const idMap = {};
  Object.entries({new: pair.new, old: pair.old}).forEach(([kind, list]) => {
    list.forEach(e => {
      idMap[e.id] = idMap[e.id] || {};
      idMap[e.id][kind] = e;
    });
  });

  return idMap;
}

function compareCourses(old, latest) {
  // If there isn't a previous set of courses,
  // don't return any differences.
  if (old === null) {
    return [];
  }

  let differences = [];

  const courseMap = byId({new: latest, old: old});
  console.log('courseMap:', courseMap);

  Object.entries(courseMap).forEach(([id, courseDelta]) => {
    console.log(courseDelta);
    if (courseDelta.new && !courseDelta.old) {
      return [{type: 'new_course', courseDelta}];
    } else if (courseDelta.old && !courseDelta.new) {
      return [{type: 'removed_course', courseDelta}];
    } else {
      const assignmentMap = byId({
        new: courseDelta.new.assignments,
        old: courseDelta.old.assignments
      });

      Object.entries(assignmentMap).forEach(([id, assignmentDelta]) => {
        differences = differences.concat(
          compareAssignments(assignmentDelta).map(e => ({
            ...e,
            course: omit(courseDelta.new, 'assignments')
          })) // add a reference to the course, without any assignments.
        );
      });
    }
  });

  return differences;
}

module.exports = {compareAssignments, compareCourses, compareDates};
