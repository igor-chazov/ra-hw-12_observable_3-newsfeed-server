const http = require('http');
const path = require('path');
const Koa = require('koa');
const cors = require('koa2-cors');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const Router = require('koa-router');
const fs = require('fs');

const app = new Koa();

app.use(
  cors({
    origin: '*',
    credentials: true,
    'Access-Control-Allow-Origin': true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
);

app.use(koaBody({
  text: true,
  urlencoded: true,
  multipart: true,
  json: true,
}));

const dirPublic = path.join(__dirname, '/public');
app.use(koaStatic(dirPublic));

const news = JSON.parse(fs.readFileSync('./news.json'));
const limit = 5;

const router = new Router();
app.use(router.routes()).use(router.allowedMethods());

function fortune(ctx, body = null, status = 200) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.3) {
        ctx.response.status = status;
        ctx.response.body = body;
        resolve();
        return;
      }

      reject(new Error('Something bad happened'));
    }, 3 * 1000);
  });
}

router.get('/api/news', async (ctx) => {
  const { lastSeenId } = ctx.request.query;
  if (lastSeenId === undefined) {
    return fortune(ctx, news.slice(0, limit));
  }

  const id = Number(lastSeenId);
  if (Number.isNaN(id)) {
    const status = 400;
    return fortune(ctx, null, status);
  }

  const index = news.findIndex((o) => o.id === id);
  if (index === -1) {
    const status = 404;
    return fortune(ctx, null, status);
  }

  const body = news.slice(index + 1, index + 1 + limit);
  return fortune(ctx, body);
});

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());

// eslint-disable-next-line no-console
server.listen(port, () => console.log('Server started'));
