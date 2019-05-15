'use strict';

/**
 * @ngdoc object
 * @name coachees
 * @requires $scope
 * @requires $interval
 * @requires $location
 * @requires $localStorage
 * @requires Coaching
 * @description
 *
 * Controller for the page which displays all coachees for a given TL.
 * $localStorage and $location, as in the rest of the controllers are used to keep
 * track of current page (so that in the event of closing the extension, the same
 * page is displayed after re-opening it). The Coaching service is used to retrieve
 * texts from the backend, since no texts are saved in the extension. It's also
 * used to retrieve all the coachees associated with the TL that's using the
 * extension. $interval is used in order to check if there were changes in the
 * backend, to make sure the local copy is always up to date.
 */

angular.module('coaching')
  .controller('coachees', ['$scope', 'Coaching', '$location', '$localStorage', '$interval',
    function ($scope, Coaching, $location, $localStorage, $interval) {
      $scope.texts = Coaching.getTexts();
      $localStorage.path = $location.path();
      $scope.changed = false;
      // Every two seconds the controller updates the value
      // of the local changed variable with the one in
      // localStorage, which in turn is updated every 15 seconds
      // after checking if the local copy is equal or not to the
      // remote copy.
      $interval(function() {
        $scope.changed = $localStorage.changed;
      }, 2000);

      $scope.find = function (force) {
        // This boolean variable (loading) is used in the
        // view to show a spinner while waiting for the
        // completion of the createInstance asynchronous call.
        $scope.loading = true;
        $scope.coachees = undefined;
        Coaching.getAllCoachees(force).then(function(coachees){
          $scope.loading = false;
          if (force) {
              $localStorage.changed = false;
              $scope.changed = false;
          }
          $scope.coachees = coachees;
        });
      };
      // This function is used to calculate the number of days
      // since the last coaching sessions for a given coachee.
      $scope.daysSinceLastCoachingSession = function (ldap) {
        var instances = Coaching.getAllInstances(ldap);
        var last_coaching_session_date = 0;

        for (var id in instances) {
          if (instances.hasOwnProperty(id)) {
            var instance = instances[id];
            // If it's an opportunity meeting but any of the smart goal fields was not completed, this meeting should not be counted.
            if (instance['type_of_meeting'] == 'Opportunity' && (!instance['smart_goal_what'] || !instance['smart_goal_how'] || !instance['smart_goal_fup_date'])) {
                continue;
            }
            var session_date = new Date(instance['session_date']).getTime();
            if (session_date > last_coaching_session_date) {
              last_coaching_session_date = session_date;
            }
          }
        }

        if (last_coaching_session_date == 0)
          return Number.POSITIVE_INFINITY;
        var difference = new Date().getTime() - last_coaching_session_date;
        return Math.floor(difference/1000/60/60/24);
      };

      $scope.lastCoachingSessionText = function(ldap) {
        var days_since = $scope.daysSinceLastCoachingSession(ldap);
        var text = 'No coaching sessions so far.';
        if (days_since >= 0 && days_since < Number.POSITIVE_INFINITY) {
          text = 'Last session was ' + days_since + ' days ago.';
        }
        return text;
      }

    }]);
