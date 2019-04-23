'use strict';

/**
 * @ngdoc object
 * @name settings
 * @requires $scope
 * @requires $window
 * @requires $localStorage
 * @requires Coaching
 * @description
 *
 * Controller for the settings page which shows several options configurable by
 * the user: the extension's theme (currently light and dark), large text, script
 * id (to link the extension to a different backend). It also displays the extension's
 * version. The Coaching service is used to retrieve texts from the backend, since no
 * texts are saved in the extension. $localStorage is used to save configurable options
 * to make them accesible elsewhere. $window is used to reload the extension to make
 * changes on the theme visible.
 */

angular.module('coaching')
  .controller('settings', ['$scope', 'Coaching', '$localStorage', '$window',
    function ($scope, Coaching, $localStorage, $window) {
      // The init function loads all current configurable
      // values using $localStorage, as well as all texts
      // using the Coaching service.
      $scope.init = function() {
        $scope.texts = Coaching.getTexts();
        $scope.large_text = $localStorage.large_text || false;
        $scope.message = $scope.large_text ? 'On': 'Off';
        $scope.theme = $localStorage.theme || 'Default Light';
        $scope.themes = ['One Dark', 'Default Light'];
        $scope.script_id = $localStorage.script_id;
        $scope.version = chrome.runtime.getManifest().version;
      }
      // When the toggle control is activated, this function
      // is called, to update the text of the control.
      $scope.onChange = function() {
        $scope.message = $scope.large_text ? 'On': 'Off';
        $localStorage.large_text = $scope.large_text;
      };
      // Whenever the current theme is updated, this funcion
      // is called, which updates the theme and reloads the
      // extension, so that the cnage is visible.
      $scope.switchTheme = function() {
        $localStorage.theme = $scope.theme;
        $localStorage.dark_theme = $scope.theme.indexOf('Dark') > 0 ? true: false;
        $window.location.reload();
      }
      // This function is called when the script id is updated.
      // It's saved using the $localStorage service.
      $scope.updateScriptID = function() {
        $localStorage.script_id = $scope.script_id;
      }
    }]);
