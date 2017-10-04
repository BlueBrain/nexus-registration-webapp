const config = {
  "endpoints": {
    "apiPrefix": "${BASE_URI}",
    "scigraphPrefix": "${SCIGRAPH_URI}"
  },
  "defaultDomain": "${DOMAIN}"
};

config.endpoints.schemasPrefix = `${config.endpoints.apiPrefix}/schemas`;
config.endpoints.dataPrefix = `${config.endpoints.apiPrefix}/data`;
config.endpoints.organizations = `${config.endpoints.apiPrefix}/organizations`;

config.endpoints.scigraphNeighbors = `${config.endpoints.scigraphPrefix}/graph/neighbors`;

config.endpoints.domainSchemas = `${config.endpoints.schemasPrefix}/${config.defaultDomain}`;

module.exports = config;
