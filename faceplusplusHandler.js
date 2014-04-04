var request = require('request');
var async = require('async');
var nconf = require('nconf');
var prefix_path = 'http://apicn.faceplusplus.com/v2';
var _ = require('underscore');


// 识别用户上传的图片信息
exports.detect = function(url, callback) {
  var url = prefix_path + '/detection/detect?api_key=' +
            nconf.get('appKey') + '&api_secret=' +
            nconf.get('appSecret') + '&url=' +
            url + '&attribute=glass,pose,gender,age,race,smiling'
  var options = {
    'method': 'GET',
    'url': url
  }

  request(options, function(error, res, body) {
     if (!error && res.statusCode == 200) {
       var obj = JSON.parse(body);
       if (obj && obj.face && obj.face[0]) {
         search(obj.face[0]['face_id'], callback);
       } else {
         console.log(body);
         callback('');
       }
     } else {
       var errorObj = JSON.parse(body);
       console.log(errorObj);
       console.log(error, res.statusCode, body)
       callback('');
     }
  });
}

// 根据图片分析后， 获取相近的3张图片。
var search = function(face_id, callback) {
  var url = prefix_path + '/recognition/search?api_secret=' +
            nconf.get('appSecret')+ '&api_key=' +
            nconf.get('appKey')+ '&key_face_id=' +
            face_id + '&faceset_name=Star'

  var options = {
    'method': 'GET',
    'url': url
  };

  request(options, function(error, res, body) {
     if (!error && res.statusCode == 200) {
       result = JSON.parse(body);
       ids = _.map(result.candidate, function(elem) {
        return elem.face_id;
       });
       getImageUrl(ids.join(','), callback);
     } else {
       console.log(error, res.statusCode, body)
       callback('');
     }
  });
}


// 根据face_id 获取匹配图片的路径， 方便存入到wp.
var getImageUrl = function(face_ids, callback) {
  var url = prefix_path + '/info/get_face?api_secret=' +
            nconf.get('appSecret')+ '&api_key=' +
            nconf.get('appKey')+ '&face_id=' + face_ids
  var options = {
    'method': 'GET',
    'url': url
  }

  request(options, function(error, res, body) {
     if (!error && res.statusCode == 200) {
       var result = JSON.parse(body);
       urls = _.map(result.face_info, function(elem) {
         return elem.url;
       });
       console.log(urls.join(','));
       callback(urls);
     } else {
       console.log(error, res.statusCode)
       callback('');
     }
  });
}
