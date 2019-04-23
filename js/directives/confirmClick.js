'use strict';

/**
 * @ngdoc object
 * @name confirmClick
 * @description
 *
 * This directive displays an OKCancel dialog and executes (or not) an
 * action based on the user's input on the aforementioned dialog.
 */

angular.module('coaching')
  .directive('ngConfirmClick', [
    function(){
      return {
        link: function (scope, element, attr) {
          var msg = attr.ngConfirmClick || "Are you sure?";
          var clickAction = attr.confirmedClick;
          element.bind('click',function (event) {
            if ( window.confirm(msg) ) {
                scope.$eval(clickAction)
            }
          });
        }
      };
    }]);
