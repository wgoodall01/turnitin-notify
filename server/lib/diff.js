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

function compareCourses(courses, latest) {
  let differences = [];
  if (latest != null) {
    for (let i = 0; i < courses.length; i++) {
      let oldCourse = latest.courses[i];
      let newCourse = courses[i];

      // Find:
      // - created/deleted assignments
      // - any changed assignment attr
      const idMap = {};
      for (const a of oldCourse.assignments) {
        const id = a.id;
        idMap[id] = idMap[id] || {};
        idMap[id].old = a;
      }
      for (const a of newCourse.assignments) {
        const id = a.id;
        idMap[id] = idMap[id] || {};
        idMap[id].new = a;
      }

      for (const id of Object.keys(idMap)) {
        const pair = idMap[id];
        const courseDifferences = compareAssignments(pair);
        const withCourse = courseDifferences.map(e => ({...e, course: newCourse}));
        differences = differences.concat(withCourse);
      }
    }
  }
  return differences;
}

module.exports = {compareAssignments, compareCourses, compareDates};
