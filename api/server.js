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

// RethinkDB
const r = require("rethinkdb");

// Redis
const asyncRedis = require("async-redis");
const redisClient = asyncRedis.createClient({
  url: process.env.REDIS_URL
});
redisClient.on("error", function (err) {
  console.log("REDIS - Error: " + err);
});

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

// Socket.io
var io = require('socket.io')(server.listener);
io.sockets.on("connection", function(socket) {
  console.log("IO - Connected");
})

async function init() {
  try {
    // Logger
    await server.register({
      plugin: hapiPino,
      options: {
        // prettyPrint: process.env.NODE_ENV !== 'production',
        prettyPrint: true,
        // logEvents: ["response", "onPostStart"],
        // level: 'debug'
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

    // RethinkDB
    let conn = await r.connect({ db: 'Cats', host: process.env.RETHINKDB_HOST });

    // Realtime cat updates
    r.table('cats').changes().run(conn, function(err, cursor) {
      cursor.each(function(err, cat) {
        io.emit("cat-" + cat.new_val.id, cat.new_val);
      })
    })

    // Realtime game updates
    r.table('games').changes().run(conn, function(err, cursor) {
      cursor.each(function(err, game) {
        // console.log('Changed game:');
        // console.log(game);

        io.emit("game-" + game.new_val.id, game.new_val);
      })
    })

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

          return await r.table('cats').get(decoded.id).run(conn);
        }
      },
      {
        method: ['PUT'], path: '/cat', config: { auth: 'jwt' },
        handler: async function(request, reply) {
          let jwt = request.headers.authorization.split(" ")[1] || request.headers.authorization;
          let decoded = JWT.decode(jwt, process.env.JWT_SECRET);

          // Update cat in rethinkdb
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
          let cat = await r.table('cats').get(decoded.id).run(conn);

          // Create new game in rethinkdb
          let game = await r.table('games').insert({ cats: [{...cat, score: 0}] }).run(conn);

          // console.log('>>> CAT:')
          // console.log(cat);

          return game;
        }
      },
      {
        method: ['POST'], path: '/game/{id}/join', config: { auth: 'jwt' },
        handler: async function(request, reply) {
          // Retrieve game from rethinkdb
          let game = await r.table('games').get(encodeURIComponent(request.params.id)).run(conn);
          if (!game) { return false; }

          // TODO: Check if game is joinable / not private?

          let jwt = request.headers.authorization.split(" ")[1] || request.headers.authorization;
          let decoded = JWT.decode(jwt, process.env.JWT_SECRET);

          // Retrieve cat from rethinkdb
          let cat = await r.table('cats').get(decoded.id).run(conn);

          // Add cat to game
          let updatedGame = {...game};
          updatedGame.cats.push({...cat, score: 0});
          
          // Update game in rethinkdb
          var update = await r.table('games').get(game.id).update({ cats: updatedGame.cats }).run(conn);

          if (update.replaced) {
            return updatedGame;
          }

          return game;
        }
      },
      {
        method: ['POST'], path: '/game/{id}/score', config: { auth: 'jwt' },
        handler: async function(request, reply) {
          // Retrieve game from rethinkdb
          let game = await r.table('games').get(encodeURIComponent(request.params.id)).run(conn);
          if (!game) { return false; }

          let jwt = request.headers.authorization.split(" ")[1] || request.headers.authorization;
          let decoded = JWT.decode(jwt, process.env.JWT_SECRET);

          // Retrieve cat from rethinkdb
          let cat = await r.table('cats').get(decoded.id).run(conn);

          // Increment score of cat
          let updatedGame = {...game};
          let catIds = updatedGame.cats.map((c) => { return c.id; });
          let index = catIds.indexOf(cat.id);
          updatedGame.cats[index].score = updatedGame.cats[index].score + 1;
          
          // Update game in rethinkdb
          var update = await r.table('games').get(game.id).update(updatedGame).run(conn);

          if (update.replaced) {
            return updatedGame;
          }

          return game;
        }
      },
      {
        method: ['GET'], path: '/game/{id}', config: { auth: false },
        handler: async function(request, reply) {
          // Retrieve game from rethinkdb
          let game = await r.table('games').get(encodeURIComponent(request.params.id)).run(conn);

          return game;
        }
      },
      {
        method: ['GET'], path: '/games', config: { auth: false },
        handler: async function(request, reply) {
          // Retrieve games from rethinkdb
          let games = await r.table('games').getAll().run(conn);

          return games;
        }
      },
      // {
      //   method: ['GET'], path: '/my/games', config: { auth: 'jwt' },
      //   handler: async function(request, reply) {
      //     let jwt = request.headers.authorization.split(" ")[1] || request.headers.authorization;
      //     let decoded = JWT.decode(jwt, process.env.JWT_SECRET);

      //     // Retrieve game from rethinkdb          
      //     let game = await r.table('games').get(  WHERE CAT ID is decoded.id  ).run(conn);

      //     return game;
      //   }
      // },
      {
        method: ['GET', 'POST'], path: "/auth", config: { auth: false },
        handler: async function(request, reply) {
          var now = new Date();

          // Create a new session
          var session = {
            valid: true, // This will be set to false when the person logs out
            id: aguid(), // A random session id
            exp: now.getTime() + 30 * 60 * 1000, // expires in 30 minutes time
          };

          // server.logger().info(session);

          // Save session in Redis
          await redisClient.set(session.id, JSON.stringify(session));

          // Create cat in rethinkdb
          await r.table('cats').insert({
            id: session.id,
            createdOn: now.toISOString(),
            updatedOn: now.toISOString(),
            name: 'Cat #' + parseInt(Math.floor(now.getTime() / 100).toString().substr(6))
          }).run(conn);

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
