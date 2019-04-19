const express = require('express'),
  helmet = require('helmet'),
  compress = require('compression'),
  cons = require('consolidate');

const app = require('./middleware/app'),
  api = require('./middleware/api'),
  req = require('./middleware/req'),
  err = require('./middleware/err');
