const express = require('express'),
  helmet = require('helmet'),
  compress = require('compression'),
  cons = require('consolidate');

const app = require('./middleware/app'),
  api = require('./middleware/api'),
  req = require('./middleware/req'),
  err = require('./middleware/err');

const config = require('./config/common');

const server = express();

server.engine('html', cons.mustache);
server.set('view engine', 'html');

server.use(helmet());
server.use(compress({ threshold: 0 }));
server.use(express.static('dist'));

server.use(req());

server.all('/api/*', api());

server.use(app());
server.use(err());

server.listen(config.port);
