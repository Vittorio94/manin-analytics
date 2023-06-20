# manin-analytics

A GDPR-compliant alternative to google analytics, running on your own Cloudflare account.

Check out the [working demo](https://analytics.vittoriolora.com/)

## The idea behind it

Cloudflare has created an amazing network for serverless applications. This analytics tool uses a Cloudflare [Durable Object](https://developers.cloudflare.com/workers/learning/using-durable-objects/) to store application data. Durable Objects are available in the **paid** Cloudflare Workers plan. It's a much cheaper option than other analytics tools like Plausible or Matomo: from a single paid workers account ($5 a month) you get 10M monthly requests and 50GB of Durable Object storage, and you can track as many different websites as you want.

## How to set it up

### 1. Create a Cloudflare account (if you don't have one)

Go to [Cloudflare.com](https://www.cloudflare.com/) and create a new account, then purchase the **paid** workers plan.

### 2. Install wrangler

Wrangler is Cloudflare's CLI to manage worker scripts. I suggest you install it globally using npm:

```
sudo npm install -g wrangler
```

### 3. Clone this repo

```
git clone git@github.com:Vittorio94/manin-analytics.git
cd manin-analytics

```

Inside the repo there are two folders:

```
manin-analytics
├── durable-object
├── public
```

The **durable-object** folder contains the code for the cloudflare worker and durable object. The **public** folder contains a simple website that tracks its own analytics using the worker and displays them using apex charts. It is inteded to be a starting point on which you can build your own analytics dashboard with the data collected from the cloudflare worker.

### 4. Publish the worker

First, navigate inside the **durable-object** folder

```
cd durable-object
```

Then upload the worker to your cloudflare account by running

```
wrangler deploy
```

For earlier versions of wrangler, you might need to run `wrangler publish` instead. Wrangler will push the code to cloudflare, and once it's done it will tell you the url of your worker. In my case it was `https://analytics-durable-object.vittorio-dev.workers.dev`, but yours will be different of course. You can also find this url from the cloudflare dashboard, under the "workers" tab.

### 5. Start tracking visitors

In order to start tracking visitors, simply include the following script tag inside every page of your website:

```html
<script>
  const cloudflare_url = "YOUR-CLOUDFLARE-URL/track";

  const referrer = document.referrer.split("/")[2];
  fetch(cloudflare_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pathName: window.location.pathname,
      referrer: referrer ? referrer : "direct",
    }),
  });
</script>
```

This script sends a post request to the /track endpoint of your worker containing information on the page being visited (pathName) and the referrer.

### 6. Get back analytics data

The analytics data is availabe by sending a GET request to the `/get` endpoint of your cloudflare worker. For example, using curl:

```
curl YOUR-CLOUDFLARE-URL/get
```

This will return a json object like this:

```json
{
  "2023-06-19": {
    "pathNames": {
      "/": {
        "5.77.89.202": 51
      },
      "/about/": {
        "5.77.89.202": 38
      }
    },
    "referrers": {
      "127.0.0.1:8080": {
        "5.77.89.202": 85
      },
      "direct": {
        "5.77.89.202": 4
      }
    },
    "countries": {
      "IT": {
        "5.77.89.202": 89
      }
    }
  }
}
```

The data is divided into daily buckets to avoid excessive size. This can then be used to build your own analytics dashboard.

### 7. Run the example dashboard inside the **public** folder

the code inside the **public** folder is just a simple static website written in plain html, css and javascript. It uses [apexcharts.js](https://apexcharts.com/) to display the data shown above inside some charts, and allows you to select between unique and non-unique visitors.

> **NOTE:** Remember to change the `cloudflare_url` variable to your own url, both in `/index.html` and `/about/index.html`
