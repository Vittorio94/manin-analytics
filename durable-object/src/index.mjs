// cors headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

// Worker entry point
export default {
  async fetch(request, env) {
    // handle OPTIONS request
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // handle request
    return await handleRequest(request, env);
  },
};

async function handleRequest(request, env) {
  // Every unique ID refers to an individual instance of the Counter class that
  // has its own state. `idFromName()` always returns the same ID when given the
  // same string as input (and called on the same class), but never the same
  // ID for two different strings (or for different classes).

  let id = env.ANALYTICS_DATA.idFromName(env.DO_NAME);
  let obj = env.ANALYTICS_DATA.get(id);

  // send request to DO
  return await obj.fetch(request);
}

// Durable Object
export class Data {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    // get request url
    let url = new URL(request.url);
    let pathName = url.pathname;
    const password = url.searchParams.get("password");

    if (pathName === "/get") {
      // get keys from DO. This endpoint is not password protected.
      try {
        let resBody = await this.state.storage.get("analytics");
        if (!resBody) {
          resBody = {};
        }

        return new Response(JSON.stringify(resBody), {
          status: 200,
          headers: corsHeaders,
        });
      } catch (error) {
        return new Response(`Error getting values from DO: ${error.message}`, {
          status: 500,
          headers: corsHeaders,
        });
      }
    } else if (pathName === "/track") {
      // get request body
      const body = await request.json();
      // track user
      const country = request.cf.country;
      const ip = request.headers.get("cf-connecting-ip");
      const pathName = body.pathName;
      const referrer = body.referrer;

      // start transaction
      let transactionRes;
      try {
        transactionRes = await this.state.storage.transaction(async (txn) => {
          let res;

          const date = new Date();
          let dateStr =
            date.getFullYear() +
            "-" +
            addLeadingZero(date.getMonth() + 1) +
            "-" +
            addLeadingZero(date.getDate());

          // get analytics key
          res = await txn.get("analytics");
          let analytics;
          if (res) {
            analytics = res;
          } else {
            // create analytics if they don't exist
            analytics = {};
          }
          // get current date data
          let dateObj;
          if (analytics[dateStr]) {
            dateObj = analytics[dateStr];
          } else {
            // initialize date object if this is the first visit of the day
            dateObj = {
              pathNames: {},
              referrers: {},
              countries: {},
            };
          }

          // update pathNames
          if (dateObj.pathNames[pathName]) {
            if (dateObj.pathNames[pathName][ip]) {
              dateObj.pathNames[pathName][ip]++;
            } else {
              dateObj.pathNames[pathName][ip] = 1;
            }
          } else {
            dateObj.pathNames[pathName] = {};
            dateObj.pathNames[pathName][ip] = 1;
          }

          // update referres
          if (dateObj.referrers[referrer]) {
            if (dateObj.referrers[referrer][ip]) {
              dateObj.referrers[referrer][ip]++;
            } else {
              dateObj.referrers[referrer][ip] = 1;
            }
          } else {
            dateObj.referrers[referrer] = {};
            dateObj.referrers[referrer][ip] = 1;
          }

          // update countries
          if (dateObj.countries[country]) {
            if (dateObj.countries[country][ip]) {
              dateObj.countries[country][ip]++;
            } else {
              dateObj.countries[country][ip] = 1;
            }
          } else {
            dateObj.countries[country] = {};
            dateObj.countries[country][ip] = 1;
          }

          // store in DO
          analytics[dateStr] = dateObj;
          res = await txn.put("analytics", analytics);
          return dateObj;
        });
        console.log(transactionRes);
        return new Response(JSON.stringify(transactionRes), {
          "content-type": "application/json;charset=UTF-8",
          headers: corsHeaders,
        });
      } catch (error) {
        return new Response(error.message, {
          status: 500,
          headers: corsHeaders,
        });
      }
    }
    return new Response("invalid pathName", {
      status: 404,
      headers: corsHeaders,
    });
  }
}

// adds a 0 to number below 9
function addLeadingZero(n) {
  if (n > 9) {
    return `${n}`;
  } else {
    return `0${n}`;
  }
}
