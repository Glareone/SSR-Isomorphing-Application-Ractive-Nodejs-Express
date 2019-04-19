const express = require('express'),
  helmet = require('helmet'),
  compress = require('compression'),
  cons = require('consolidate');

const app = require('./middleware/app'),
  api = require('./middleware/api'),
  req = require('./middleware/req'),
  err = require('./middleware/err');

const methodOverride = require('method-override');

const config = require('./config/common');

const server = express();

server.engine('html', cons.mustache);
server.set('view engine', 'html');

server.use(helmet());

// Так как мы планируем работать не только с GET-запросами, но и со всеми возможными REST-глаголами (POST/PUT/DELETE),
// а также выполнять запросы без JS на клиенте (т.е. по средствам html-форм), необходимо также внести парочку
// изменений в основной файл веб-сервера из первой части
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(methodOverride('_method'));


server.use(compress({ threshold: 0 }));
server.use(express.static('dist'));

server.use(req());

server.all('/api/*', api());

server.use(app());
server.use(err());



server.listen(config.port);
