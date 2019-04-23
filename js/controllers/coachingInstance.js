'use strict';

/**
 * @ngdoc object
 * @name coachingInstance
 * @requires $scope
 * @requires $routeParams
 * @requires $location
 * @requires $localStorage
 * @requires Coaching
 * @description
 *
 * Controller for the page which displays a given coaching instance.
 * $localStorage and $location, as in the rest of the controllers are used to keep
 * track of current page (so that in the event of closing the extension, the same
 * page is displayed after re-opening it). The Coaching service is used to retrieve
 * texts from the backend, since no texts are saved in the extension. It's also
 * used to retrieve data associated with the coaching instance, as well to update
 * its data and delete it. It's also used to send an email report to the agent with
 * a copy of the smart goal data.
 */

angular.module('coaching')
  .controller('coachingInstance', ['$scope', '$routeParams', 'Coaching', '$location', '$localStorage',
    function ($scope, $routeParams, Coaching, $location, $localStorage) {
      $localStorage.path = $location.path()
      $scope.texts = Coaching.getTexts();
      $scope.large_text = $localStorage.large_text;
      $scope.send_report_label = "";
      // This function is used to format all dates to match the
      // one used by the Google Form.
      $scope.formatDate = function(date) {
        var date = new Date(date);
        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();

        return (monthIndex + 1) + '/' + day + '/' + year;
      };
      // This function relies on the Coaching service to send an
      // email report with smart goal data to the agent.
      $scope.sendEmailReport = function() {
        Coaching.sendEmailReport($scope.coaching_instance.ldap,
                                $scope.coaching_instance.smart_goal_what,
                                $scope.coaching_instance.smart_goal_how,
                                $scope.formatDate($scope.coaching_instance.session_date),
                                $scope.formatDate($scope.coaching_instance.smart_goal_fup_date)).then(function() {
                                  $scope.send_report_label = "Email sent.";
                                });
      };
      // This function is called every time any field of the coaching
      // instance is updated. It relies on the Coaching service, which
      // in turn updates the value in question in the backend.
      $scope.update = function(key) {
        Coaching.updateInstance($scope.coaching_instance, key);
      };
      // This function is called after the trash icon is clicked. It 
      // results in the deletion of the coaching instance.
      $scope.remove = function() {
        $scope.deleted = true;
        Coaching.removeInstance($scope.coaching_instance).then(function() {
          $scope.deleted = false;
          var new_path = "/activeCoachingInstances/" + $scope.coaching_instance.ldap;
          $location.path(new_path);
        });
      }
      // This function is called on load, to retrieve all data associated
      // with the coaching instance.
      $scope.findOne = function () {
        $scope.coaching_instance = Coaching.getInstance($routeParams.instanceId);
      };
    }]);
