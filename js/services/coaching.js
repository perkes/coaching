'use strict';

/**
 * @ngdoc object
 * @name coaching
 * @requires $http
 * @requires $q
 * @requires $sce
 * @requires $localStorage
 * @description
 *
 * This service handles all communication with the backend. Including
 * creating, reading, updating and deleting coaching instances, retrieving
 * texts (since all captions are stores in the backend), checking the local
 * copy for differences and sending email reports. The $http service is used
 * to handle all communication to the backend. $sce is used to add urls as
 * trusted resources, $q to deliver deferred promises, while $localStorage
 * is used to store the coaching instances, the list of coachees, the script id,
 * the extension's texts and the extension's user's ldap (usually a TL).
 */

angular.module('coaching')
  .factory('Coaching', ['$http', '$q', '$sce', '$localStorage', function ($http, $q, $sce, $localStorage)
  {
    var SCRIPT_URL = 'https://script.google.com/a/google.com/macros/s/'+ $localStorage.script_id + '/exec';
    var coaching_instances = $localStorage.coaching_instances;
    var coachees = $localStorage.coachees;
    var texts = $localStorage.texts;
    var user = $localStorage.user;

    var compareObjects = function(obj1, obj2) {
      return JSON.stringify(obj1) == JSON.stringify(obj2);
    }
    // This function is used to compare the coaching instances in the
    // local copy to those in the remote copy.
    var compareCoachingInstances = function(instances1, instances2) {
      for (var id in instances1) {
        if (instances1.hasOwnProperty(id)) {
          for (var iid in instances1[id]) {
            if (instances1[id].hasOwnProperty(iid) && ['id', '$$hashKey'].indexOf(iid) == -1) {
              try {
                if (!compareObjects(instances1[id][iid], instances2[id][iid])) {
                  return false;
                }
              } catch (err) {
                console.log(err.message);
              }
            }
          }
        }
      }
      return true;
    };

    var checkChanges = function() {
      var defer = $q.defer();
      chrome.identity.getProfileUserInfo(function(userinfo){
        user = userinfo['email'];
        $localStorage.user = user;
        var url = $sce.trustAsResourceUrl(SCRIPT_URL +
                                          '?lead_email=' + encodeURIComponent(user) +
                                          '&func=read');
        $http.jsonp(url, {jsonpCallbackParam: 'callback'}).
          then(function(response) {
            var changes_in_coaching_instances = !compareCoachingInstances(coaching_instances, response.data.coaching_instances);
            var changes_in_coachees = !compareObjects(coachees, response.data.coachees);
            defer.resolve(changes_in_coaching_instances || changes_in_coachees);
          });
      });
      return defer.promise;
    };
    // This function calls the send_report function in the backend, which in
    // turn sends an email report to the coachee with the smart goal data.
    var sendEmailReport = function(agent_ldap, what, how, when, fup_date) {
      var defer = $q.defer();
      var url = $sce.trustAsResourceUrl(SCRIPT_URL +
                                        '?func=send_report' +
                                        '&coach=' + encodeURIComponent(user) +
                                        '&agent=' + encodeURIComponent(agent_ldap) +
                                        '&what=' + encodeURIComponent(what) +
                                        '&how=' + encodeURIComponent(how) +
                                        '&when=' + encodeURIComponent(when) +
                                        '&fup_date=' + encodeURIComponent(fup_date));

      $http.jsonp(url, {jsonpCallbackParam: 'callback'}).
        then(function(response) {
          defer.resolve(response);
        });

      return defer.promise;
    };

    var getAllCoachees = function(force) {
      var defer = $q.defer();
      if (coachees && !force)
        defer.resolve(coachees);
      else {
        chrome.identity.getProfileUserInfo(function(userinfo){
          user = userinfo['email'];
          $localStorage.user = user;
          var url = $sce.trustAsResourceUrl(SCRIPT_URL +
                                            '?lead_email=' + encodeURIComponent(user) +
                                            '&func=read');
          $http.jsonp(url, {jsonpCallbackParam: 'callback'}).
            then(function(response) {
              coaching_instances = response.data.coaching_instances;
              coachees = response.data.coachees;
              texts = response.data.form_texts;
              $localStorage.coaching_instances = coaching_instances;
              $localStorage.coachees = coachees;
              $localStorage.texts = texts;
              defer.resolve(coachees);
            });
        });
      }

      return defer.promise;
    };

    var getAllInstances = function(agent_ldap) {
      var my_instances = {}
      for (var id in coaching_instances) {
        if (coaching_instances.hasOwnProperty(id)) {
          if (coaching_instances[id]['ldap'] == agent_ldap) {
            my_instances[id] = coaching_instances[id]
            my_instances[id]['id'] = id;
          }
        }
      }
      return my_instances;
    };

    var getInstance = function(id)
    {
      return coaching_instances[id];
    };

    var getTexts = function() {
      return texts;
    }

    var createInstance = function(agent_ldap)
    {
      var defer = $q.defer();
      // This particular format was chosen to match the one used by Google Forms.
      var timestamp = new Date().toLocaleString('en-US', {hour12: false}).replace(',', '');
      var url = $sce.trustAsResourceUrl(SCRIPT_URL +
                                        '?func=create' +
                                        '&lead_email=' + encodeURIComponent(user) +
                                        '&agent_ldap=' + encodeURIComponent(agent_ldap) +
                                        '&timestamp=' + encodeURIComponent(timestamp));

      $http.jsonp(url, {jsonpCallbackParam: 'callback'}).
        then(function(response) {
          var new_instance = response.data.new_instance;
          new_instance['id'] = new Date(new_instance['timestamp']).getTime() + new_instance['email'];
          coaching_instances[new_instance['id']] = new_instance;
          defer.resolve(new_instance);
        });

      return defer.promise;
    };

    var removeInstance = function(instance)
    {
      var defer = $q.defer();
      var url = $sce.trustAsResourceUrl(SCRIPT_URL +
                                        '?func=delete' +
                                        '&timestamp=' + encodeURIComponent(instance['timestamp']) +
                                        '&email=' + encodeURIComponent(instance['email']));

      $http.jsonp(url, {jsonpCallbackParam: 'callback'}).
        then(function(response) {
          delete coaching_instances[instance['id']];
          defer.resolve(response.data.result);
        });

      return defer.promise;
    };

    var updateInstance = function(instance, key)
    {
      var defer = $q.defer();
      var updated = false
      var id = instance['id'];
      var timestamp = instance['timestamp'];
      var email = instance['email'];
      var value = instance[key];
      var url = $sce.trustAsResourceUrl(SCRIPT_URL +
                                        '?func=update'+
                                        '&timestamp=' + encodeURIComponent(timestamp) +
                                        '&email=' + encodeURIComponent(email) +
                                        '&key=' + encodeURIComponent(key) +
                                        '&value=' + encodeURIComponent(value));

      $http.jsonp(url, {jsonpCallbackParam: 'callback'}).
        then(function(response) {
          updated = true;
          coaching_instances[id][key] = value;
          defer.resolve(updated);
        });

      return defer.promise;
    };

    return {
      /**
       * @ngdoc method
       * @name checkChanges
       * @description
       * Check changes returns a promise which in turns resolves to a boolean value,
       * representing whether the local copy matches the remote copy or not.
       * Only the coaching instances and the coachee list is checked, not extension's
       * texts.
       * @return {defer.promise} Promise that resolves to boolean.
       */
      "checkChanges"    : checkChanges,
      /**
       * @ngdoc method
       * @name sendEmailReport
       * @description
       * This function calls the send_report function in the backend, which in
       * turn sends an email report to the coachee with the smart goal data.
       * agent_ldap, what, how, when, fup_date
       * @param {agent_ldap} agent_ldap The report's recipient. The coachee.
       * @param {what} what The actual smart goal.
       * @param {how} how How the smart goal is going to be achieved.
       * @param {when} when Smart Goal deadline.
       * @param {fup} when Follow up date.
       * @return {defer.promise} Promise that resolves to the server's response.
       */
      "sendEmailReport" : sendEmailReport,
      /**
       * @ngdoc method
       * @name getAllInstances
       * @description
       * This function retrieves all coaching instances associated to a given
       * coachee's ldap. It should always be called after getAllCoachees, since
       * the latter actually makes the request to get all the data at once from
       * the backend. This is done for efficency reasons.
       * @param {agent_ldap} agent_ldap The coachee's ldap.
       * @return {my_instances} An id-indexed object containing all of the
       * agent's coaching instances.
       */
      "getAllInstances" : getAllInstances,
      /**
       * @ngdoc method
       * @name getAllCoachees
       * @description
       * This function retrieves all coaching instances (for all coachees
       * associated to the user), coachees and texts. It only returns the
       * coachees (through a promise).
       * @param {force} force When force is true, the data is pulled from
       * the backend, otherwise the previously pulled data is used. This
       * is used mostly when 'refreshing' data.
       * @return {defer.promise} Promise that resolves to the array of
       * coachees.
       */
      "getAllCoachees"  : getAllCoachees,
      /**
       * @ngdoc method
       * @name getInstance
       * @description
       * This function retrieves a specific coaching instance associated
       * with a given id.
       * @param {id} id The coaching instance id that the caller wants to
       * retrieve
       * @return {coaching_instance} The coaching instance associated to
       * the id.
       */
      "getInstance"     : getInstance,
      /**
       * @ngdoc method
       * @name getTexts
       * @description
       * This function returns all texts used in the extension in a key
       * indexed object. It should always be called after getAllCoachees, since
       * the latter actually makes the request to get all the data at once from
       * the backend. This is done for efficency reasons.
       * @return {texts} A key-indexed object containing all of the extension's
       * texts.
       */
      "getTexts"        : getTexts,
      /**
       * @ngdoc method
       * @name createInstance
       * @description
       * This function creates a new instance both locally and in the backend
       * associated to a given coachee. If the backend creation fails, the new
       * instance is not created locally either.
       * @param {agent_ldap} agent_ldap The coachee's ldap.
       * @return {defer.promise} Promise that resolves to the new instance.
       */
      "createInstance"  : createInstance,
      /**
       * @ngdoc method
       * @name removeInstance
       * @description
       * This function deletes an instance both locally and in the backend.
       * Either both things happen or none of them.
       * @param {instance} instance The instance to be deleted (Object).
       * @return {defer.promise} Promise that resolves to the backend's
       * response (OK, NOK).
       */
      "removeInstance"  : removeInstance,
      /**
       * @ngdoc method
       * @name updateInstance
       * @description
       * This function updates the value of a given key within an instance.
       * @param {instance} instance The instance to be updated (Object).
       * @param {key} key The key of the value to be updated (Object).
       * @return {defer.promise} Promise that resolves to the backend's
       * response (OK, NOK).
       */
      "updateInstance"  : updateInstance
    };
  }]);
