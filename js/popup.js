'use strict';

/**
 *
 * @ngdoc module
 * @name coaching
 *
 * @requires ngAnimate
 * @requires ngRoute
 * @requires ngSanitize
 * @requires ngMaterial
 * @requires ngStorage
 * @requires ngMdIcons
 * @requires xeditable
 *
 * @description
 *
 * This module defines the core application behaviour souch as routing, specifies
 * the routine that checks for changes in the remote copy, as well as setting the
 * default script id in case none is defined in localStorage and also sets the app's
 * theme.
 *
 **/

angular.module('coaching', [
  'ngAnimate',
  'ngRoute',
  'ngSanitize',
  'ngMaterial',
  'ngStorage',
  'ngMdIcons',
  'xeditable',
]).config(['$animateProvider', '$routeProvider', '$compileProvider', '$mdThemingProvider', '$localStorageProvider',
  function($animateProvider, $routeProvider, $compileProvider, $mdThemingProvider, $localStorageProvider) {
    // Angular only allows anchor references included in a whitelist which doesn't include
    // chrome-extension by default. This whitelist can be overwritten using the following
    // method.
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|file|mailto|chrome-extension):/);
    $routeProvider
      .when('/coachees', {
          templateUrl: 'partials/coachees.html',
          controller: 'coachees'
      })
      .when('/activeCoachingInstances/:ldap', {
          templateUrl: 'partials/activeCoachingInstances.html',
          controller: 'activeCoachingInstances'
      })
      .when('/coachingInstance/:instanceId', {
          templateUrl: 'partials/coachingInstance.html',
          controller: 'coachingInstance'
      })
      .when('/settings', {
          templateUrl: 'partials/settings.html',
          controller: 'settings'
      })
      .otherwise({
        redirectTo: 'coachees'
      });

    $animateProvider.classNameFilter(/angular-animate/);
    // Checks and loads current theme based on the data in
    // local storage. By default: light-theme.
    if ($localStorageProvider.get('dark_theme')) {
      $mdThemingProvider.theme('default').dark();
    }
    // If no script id is specified in local storage, a default id is used.
    if (!$localStorageProvider.get('script_id')) {
      $localStorageProvider.set('script_id', 'AKfycbwTQrayIDrdQKzc_Sz1fl5vhM0UjYTpzJK36rwhmK9778qfkqQ');
    }
  }]).run(['Coaching', '$location', '$localStorage', '$interval', function(Coaching, $location, $localStorage, $interval){
    // Location is changed on load to the last known location.
    if ($localStorage.path) {
      $location.path($localStorage.path);
    }
    // The local copy is checked against the remote copy every
    // seconds for differences. A warning is shown if changes
    // are detected.
    $interval(function() {
      Coaching.checkChanges().then(function(changed) {
        $localStorage.changed = changed;
      });
    }, 15000);
  }]);
