(function() {
  'use strict';

  angular.module('oauth.cronofy', ['oauth.utils'])
    .factory('$ngCordovaCronofy', cronofy);

  function cronofy($q, $http, $cordovaOauthUtility) {
    return { signin: oauthCronofy };

    /*
     * Sign into the Cronofy service
     *
     * @param    string clientId
     * @param    object options
     * @return   promise
     */
    function oauthCronofy(clientId, clientSecret, appScope, options) {
      var deferred = $q.defer();
      if(window.cordova) {
        if($cordovaOauthUtility.isInAppBrowserInstalled()) {
          var redirect_uri = "http://localhost/callback";
          var response_type = "code";
          var state = "";
          if(options !== undefined) {
            if(options.hasOwnProperty("redirect_uri")) {
              redirect_uri = options.redirect_uri;
            }
            if(options.hasOwnProperty("state")) {
              state = "&state=" + options.state;
            }
          }
          var browserRef = window.cordova.InAppBrowser.open('https://app.cronofy.com/oauth/authorize?client_id=' + clientId + '&redirect_uri=' + redirect_uri + '&response_type=' + response_type + state + '&scope=' + appScope.join(","), '_blank', 'location=no,clearsessioncache=yes,clearcache=yes');
          browserRef.addEventListener('loadstart', function(event) {
            if((event.url).indexOf(redirect_uri) === 0) {
              var requestToken = (event.url).split("code=")[1];
              $http.defaults.headers.post['Content-Type'] = 'application/json; charset=utf-8';
              $http({
                method: "post",
                url: "https://api.cronofy.com/oauth/token",
                data: "client_id=" + clientId + "&client_secret=" + clientSecret + "&redirect_uri=" + redirect_uri + "&grant_type=authorization_code" + "&code=" + requestToken })
                  .success(function(data) {
                    deferred.resolve(data);
                  })
                  .error(function(data, status) {
                    deferred.reject("Problem authenticating");
                  })
                  .finally(function() {
                    setTimeout(function() {
                      browserRef.close();
                    }, 10);
                  });
            }
          });
          browserRef.addEventListener('exit', function(event) {
            deferred.reject("The sign in flow was canceled");
          });
        } else {
            deferred.reject("Could not find InAppBrowser plugin");
        }
      } else {
        deferred.reject("Cannot authenticate via a web browser");
      }

      return deferred.promise;
    }
  }

  cronofy.$inject = ['$q', '$http', '$cordovaOauthUtility'];
})();
