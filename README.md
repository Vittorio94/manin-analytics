# manin-analytics

A GDPR-compliant alternative to google analytics, running on your own cloudflare account.

## The idea behind it

Cloudflare has created an amazing network for serverless applications. This analytics tool uses a Cloudflare [Durable Object](https://developers.cloudflare.com/workers/learning/using-durable-objects/) to store application data. Durable Objects are available in the **paid** Cloudflare Workers plan. It's a much cheaper option than other analytics tools like Plausible or Matomo: from a single paid workers account ($5 a month) you get 10M monthly requests and 50GB of Durable Object storage, and you can track as many different websites as you want.

## How to set it up

### 1. Create a Cloudflare account (if you don't have one)

Go to [Cloudflare.com](https://www.cloudflare.com/) and create a new account, then purchase the **paid** workers plan.

### 2. Install wrangler

Wrangler is Cloudflare's CLI

### 2. Clone this repo

```
git clone git@github.com:Vittorio94/manin-analytics.git
cd manin-analytics

```
