const express = require('express'),
  helmet = require('helmet'),
  compress = require('compression'),
  cons = require('consolidate'),
  methodOverride = require('method-override'),
  // Несколько ключевых настроек для нашей печеньки — всегда следует выставлять httpOnly и sameSite.
  // При переходе на SSL, можно будет активировать еще и secure (кука будет отправляться только при работе через https)
  // Добавляем этот модуль в файл веб-сервера:
  session = require('express-session');

const app = require('./middleware/app'),
  api = require('./middleware/api'),
  req = require('./middleware/req'),
  err = require('./middleware/err');

const config = require('./config/common');

const server = express();

server.enable('trust proxy');

server.engine('html', cons.mustache);
server.set('view engine', 'html');

server.use(helmet());

// Использование сессий, которые мы подключили через express-session
server.use(session(config.session));

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
