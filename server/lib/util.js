function mapBy(arr, key) {
  return arr.reduce((a, e) => ({...a, [e[key]]: e}), {});
}

module.exports = {mapBy};
