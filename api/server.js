"use strict";

// Environment
if (process.env.NODE_ENV === "production") {
  require("env2")(".env");
} else {
  // require("env2")("api/.env." + process.env.NODE_ENV);
  require("env2")(".env." + process.env.NODE_ENV);
}

console.log("NODE_ENV");
console.log(process.env.NODE_ENV);

// Hapi
const hapi = require("hapi");

// Logging
const hapiPino = require("hapi-pino");

// Auth
const hapiAuthJWT2 = require("hapi-auth-jwt2");
const JWT = require("jsonwebtoken");
const aguid = require("aguid");

// Auth - Redis connection
const asyncRedis = require("async-redis");
const redisClient = asyncRedis.createClient({
  url: process.env.REDIS_URL
});
redisClient.on("error", function (err) {
  console.log("Error " + err);
});
// Confirm we can access redis
// redisClient.set('redis', 'working');
// redisClient.get('redis', function (redisError, reply) {
//   /* istanbul ignore if */
//   if (redisError) {
//     console.log(redisError);
//   }

//   console.log('redis is ' + reply);
// });

// Auth - Validation
const validate = async function (decoded, request) {
  // console.log(">>> DECODED token:");
  // console.log(decoded);

  let reply = await redisClient.get(decoded.id);

  // console.log('>>> REDIS reply:');
  // console.log(reply);

  // Check if session is valid
  let session;
  if (reply) {
    session = JSON.parse(reply);
  }
  else { // Unable to find session in redis ... reply is null
    return { isValid: false };
  }

  return { isValid: session.valid === true };
};

// RethinkDB
const r = require("rethinkdb");

// Create a server with a host and port
const server = hapi.server({
  host: "0.0.0.0",
  port: process.env.PORT || 80,
  routes: {
    cors: {
      origin: ['*']
    }
  }
});

async function init() {
  try {
    // Logger
    await server.register({
      plugin: hapiPino,
      options: {
        // prettyPrint: process.env.NODE_ENV !== 'production',
        prettyPrint: true,
        logEvents: ["response", "onPostStart"]
      }
    });

    // Auth
    await server.register(hapiAuthJWT2);
    server.auth.strategy(
      'jwt',
      'jwt',
      {
        key: process.env.JWT_SECRET,
        validate: validate,
        verifyOptions: {
          algorithms: ['HS256']
        }
      }
    );
    server.auth.default('jwt');

    // Routes
    server.route([
      {
        method: "GET", path: "/", config: { auth: false },
        handler: function(request, reply) {
          return {
            started: new Date(server.info.started).toISOString()
          };
        }
      },
      {
        method: ['GET', 'POST'], path: '/restricted', config: { auth: 'jwt' },
        handler: function(request, reply) {
          return true;
        }
      },
      {
        method: ['GET'], path: '/me', config: { auth: 'jwt' },
        handler: async function(request, reply) {
          let jwt = request.headers.authorization.split(" ")[1] || request.headers.authorization;
          let decoded = JWT.decode(jwt, process.env.JWT_SECRET);

          // Retrieve cat from rethinkdb
          let conn = await r.connect({ db: 'Cats' });

          return await r.table('cats').get(decoded.id).run(conn);
        }
      },
      {
        method: ['PUT'], path: '/cat', config: { auth: 'jwt' },
        handler: async function(request, reply) {
          let jwt = request.headers.authorization.split(" ")[1] || request.headers.authorization;
          let decoded = JWT.decode(jwt, process.env.JWT_SECRET);

          // Update cat in rethinkdb
          let conn = await r.connect({ db: 'Cats' });
          let cat = await r.table('cats').get(decoded.id).update({ ...request.payload, updatedOn: new Date().toISOString() }).run(conn);
          // console.log('>>> CAT:')
          // console.log(cat);

          return cat;
        }
      },
      {
        method: ['POST'], path: '/play', config: { auth: 'jwt' },
        handler: async function(request, reply) {
          let jwt = request.headers.authorization.split(" ")[1] || request.headers.authorization;
          let decoded = JWT.decode(jwt, process.env.JWT_SECRET);

          // Retrieve cat from rethinkdb
          let conn = await r.connect({ db: 'Cats' });
          let cat = await r.table('cats').get(decoded.id).run(conn);

          // Create new game in rethinkdb
          let game = await r.table('games').insert({ cats: [cat] }).run(conn);
          // console.log('>>> CAT:')
          // console.log(cat);

          return game;
        }
      },
      {
        method: ['GET'], path: '/game/{id}', config: { auth: false },
        handler: async function(request, reply) {
          // Retrieve game from rethinkdb
          let conn = await r.connect({ db: 'Cats' });
          let game = await r.table('games').get(encodeURIComponent(request.params.id)).run(conn);

          return game;
        }
      },
      {
        method: ['GET', 'POST'], path: "/auth", config: { auth: false },
        handler: async function(request, reply) {
          // Create a new session
          var session = {
            valid: true, // This will be set to false when the person logs out
            id: aguid(), // A random session id
            exp: new Date().getTime() + 30 * 60 * 1000, // expires in 30 minutes time
          };

          // Save session in Redis
          await redisClient.set(session.id, JSON.stringify(session));

          // Create cat in rethinkdb
          let now = new Date();
          let conn = await r.connect({ db: 'Cats' });
          await r.table('cats').insert({ id: session.id, createdOn: now.toISOString(), updatedOn: now.toISOString() }).run(conn);
          // let cat = await r.table('cats').insert({ id: session.id, createdOn: now.toISOString(), updatedOn: now.toISOString() }).run(conn);
          // console.log('>>> CAT:')
          // console.log(cat);

          // Sign the session as a JWT
          let token = JWT.sign(session, process.env.JWT_SECRET);

          return { token: token, ...session };
        }
      },
      {
        method: ['GET', 'POST'], path: "/logout", config: { auth: 'jwt' },
        handler: async function(request, reply) {
          let jwt = request.headers.authorization.split(" ")[1] || request.headers.authorization;
          let decoded = JWT.decode(jwt, process.env.JWT_SECRET);

          let redisReply = await redisClient.get(decoded.id);

          let session = JSON.parse(redisReply);
          // console.log('>>> SESSION:')
          // console.log(session);

          // Update the session to no longer valid:
          session.valid = false;
          session.ended = new Date().getTime();

          // Save session in Redis
          await redisClient.set(session.id, JSON.stringify(session));

          return true;
        }
      }
    ]);

    // Start server
    await server.start();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

init();
