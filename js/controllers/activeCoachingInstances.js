'use strict';

/**
 * @ngdoc object
 * @name activeCoachingInstances
 * @requires $scope
 * @requires $routeParams
 * @requires $location
 * @requires $localStorage
 * @requires Coaching
 * @description
 *
 * Controller for the page which displays all coaching instances for a given agent.
 * $localStorage and $location, as in the rest of the controllers are used to keep
 * track of current page (so that in the event of closing the extension, the same
 * page is displayed after re-opening it). The Coaching service is used to retrieve
 * texts from the backend, since no texts are saved in the extension. It's also
 * used to retrieve all the coaching instances associated with the relevant agent,
 * and also to create new coaching instances related to the same agent. The agent's
 * ldap is retrieved through $routeParams (since it's encoded in the route).
 */

angular.module('coaching')
  .controller('activeCoachingInstances', ['$scope', '$routeParams', 'Coaching', '$location', '$localStorage',
    function ($scope, $routeParams, Coaching, $location, $localStorage) {
      $localStorage.path = $location.path()
      $scope.large_text = $localStorage.large_text;
      $scope.texts = Coaching.getTexts();
      // This function retrieves all active coaching instances
      // associated with the agent in question.
      $scope.find = function () {
        $scope.active_coaching_instances = Object.values(Coaching.getAllInstances($routeParams.ldap));
      };

      $scope.create = function() {
        // This boolean variable is used in the view to show a
        // spinner while waiting for the completion of the
        // createInstance asynchronous call.
        $scope.added = true;
        Coaching.createInstance($routeParams.ldap).then(function(new_instance){
          $scope.added = false;
          var new_instance_path = "/coachingInstance/" + new_instance.id;
          // Navigates to the newly created instance.
          $location.path(new_instance_path);
        });
      };

      // This function is used to convert readable timestamps
      // into UNIX timestamps which are easily ordered.
      $scope.dateToUnixTimestamp = function(timestamp) {
        return new Date(timestamp).getTime();
      }
    }]);
