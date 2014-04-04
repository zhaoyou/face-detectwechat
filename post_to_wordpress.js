
var wp = require('wporg');
var request = require('request');
var async = require('async');
var nconf = require('nconf');
var faceplusplus = require('./faceplusplusHandler');
var _ = require('underscore');


var client = wp.createClient({
    username: nconf.get('wp_user'),
    password: nconf.get('wp_password'),
    url: nconf.get('wp_url') + "/xmlrpc.php"
});


var downloadImage = function(name, url, callback) {
  var requestSettings = {
    method: 'GET',
    url: url,
    encoding: null
  };

  request(requestSettings, function(error, response, body) {
          // Use body as a binary Buffer
    //callback(name, body)
    client.uploadFile({
        name: name || 'img_dl_navicatMySQL.png',
        type: 'image/png',
        bits: body
    }, function(err, data) {
      console.log(err, data);
      callback(err, data);
    });
  });
}



var postToWP = function(name, urls, cb) {
  var content = _.map(urls, function(elem, index) {
    return makeImageTemplate(elem, index);
  });
  client.newPost({
      post_title: name || 'post from node.js',
      post_content: content.join(''),
      post_status: 'publish',
      post_author: 'hadeser',
      comment_status: 'open'
  }, function(err, data) {
    console.log(err, data);
    cb(data);
  });
}

var makeImageTemplate = function(url, index) {
  var t = '<a href="' + url + '"><img class="alignnone size-medium wp-image-113" alt="xxxx.jpg" src="' + url + '" width="199" height="300" /></a> ';

  if (index === 0) {
    t += '\n';
  }

  return  t;
}

exports.search = function(picUrl, reply_callback) {
  async.parallel([
    function(callback) {
      faceplusplus.detect(picUrl, function(result) {
        // 获取相似图片失败
        if (result === '') {
          callback({'error': ''}, null);
        } else {
          callback(null, result);
        }
      });
    },
    function(callback) {
      downloadImage('xxxx.jpg', picUrl, function(error, result) {
        callback(error, result.url);
      });
    }
  ], function(err, result) {
    if (err) {
      reply_callback('')
    } else {
      // save to wp.
      var allUrl = [result[1]];
      Array.prototype.push.apply(allUrl, result[0])

      postToWP('自拍秀图', allUrl, function(data) {

        var url = nconf.get('wp_url') + '/?p=' + data;
        reply_callback('相似明星照 ' + url)
      });
    }
  });
}






