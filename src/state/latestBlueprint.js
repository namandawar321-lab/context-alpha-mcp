let latestBlueprint = null;

function setLatestBlueprint(blueprint) {
  latestBlueprint = blueprint;
}

function getLatestBlueprint() {
  return latestBlueprint;
}

module.exports = {
  setLatestBlueprint,
  getLatestBlueprint
};
