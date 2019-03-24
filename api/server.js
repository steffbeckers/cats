"use strict";

const Hapi = require("hapi");

// Create a server with a host and port
const server = Hapi.server({
  host: "0.0.0.0",
  port: 80
});

// Routes
server.route({
  method: "GET",
  path: "/",
  handler: function(request, h) {
    return {
      started: new Date(server.info.started).toISOString()
    };
  }
});

server.route({
  method: "POST",
  path: "/",
  handler: function(request, h) {
    request.logger.info(JSON.stringify(request.payload));
    
    return true;
  }
});

async function init() {
  try {
    // Logger
    await server.register({
      plugin: require("hapi-pino"),
      options: {
        // prettyPrint: process.env.NODE_ENV !== 'production',
        prettyPrint: true,
        logEvents: ["response", "onPostStart"]
      }
    });

    // Start server
    await server.start();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

init();
