function formatCourses(courses) {
  let msg = '';
  for (const c of courses) {
    msg += '\n' + c.name;
    for (const a of c.assignments) {
      msg += `\t${a.name}: graded=${a.isGraded}, similar=${a.similarity}, score=${a.points}, total=${a.total}\n`;
    }
  }
}

function formatMessage(d) {
  const {type, pair, course} = d;
  const hasGrade = pair.new && pair.new.points != null;
  const grade = hasGrade
    ? `(${pair.new.points}/${pair.new.total} = ${(pair.new.points / pair.new.total).toFixed(2)})`
    : '';
  switch (type) {
    case 'new_assignment':
      return `New Assignment in ${course.name}: '${pair.new.name}' due ${pair.new.due.date} ${pair
        .new.due.time}`;
    case 'removed_assignment':
      return `Removed assignment '${pair.old.name}'`;
    case 'graded_assignment':
      return `'${pair.new.name}' was graded. ${grade}`;
    case 'change_start':
      return `'${pair.new.name}' now opens on ${pair.new.start.date} ${pair.new.start.time}`;
    case 'change_due':
      return `'${pair.new.name}' is now due on ${pair.new.due.date} ${pair.new.due.time}`;
    case 'change_post':
      return `'${pair.new.name}' now posts on ${pair.new.post.date} ${pair.new.post.time}`;
    default:
      throw new Error("Couldn't format message");
  }
}

module.exports = {formatCourses, formatMessage};
