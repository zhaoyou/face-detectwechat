

/**
 * Module dependencies.
 */

var express = require('express');
var wechat = require('wechat');
var nconf = require('nconf');
//nconf
nconf.argv().env().file({file: process.cwd() + '/config.json'});
console.log(nconf.get('wp_url'), nconf.get('wp_user'), nconf.get('wp_password'), nconf.get('wechat_token'));

var routes = require('./routes');
var user = require('./routes/user');
var replyHandler = require('./reply_img_text');
var faceplusplus = require('./faceplusplusHandler');
var post_to_wordpress = require('./post_to_wordpress');

var http = require('http');
var path = require('path');

var app = express();

//nconf
//nconf.argv().env().file({file: process.cwd() + '/config.json'});
//console.log(nconf.get('wp_url'), nconf.get('wp_user'), nconf.get('wp_password'));

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


app.use(express.cookieParser());
app.use(express.session({secret: 'keyboard cat', cookie: {maxAge: 600000}}));

app.use('/wechat', wechat(nconf.get('wechat_token'), wechat.text(function (info, req, res, next) {
  if (info.Content === '=') {
    console.log('text', req.wxsession.text);
    var exp = req.wxsession.text.join('');
    req.wxsession.text = '';
    res.reply(exp);
  } else {
    req.wxsession.text = req.wxsession.text || [];
    req.wxsession.text.push(info.Content);
    console.log('wxsession text', req.wxsession.text);
    res.reply('' + info.Content);
  }
}).image(function(info, req, res, next) {
    console.log(info.PicUrl);
    post_to_wordpress.search(info.PicUrl, function(r) {
      if (r !== '') {
        res.reply(r);
      } else {
        res.reply('Fail');
      }
    });
})));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
