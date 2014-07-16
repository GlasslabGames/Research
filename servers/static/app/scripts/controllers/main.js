'use strict';

/**
 * @ngdoc function
 * @name staticApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the staticApp
 */
angular.module('staticApp')
  .controller('MainCtrl', function ($scope, $http) {
        $scope.gameId = "AA-1";
        $scope.userIds = "";
        $scope.startDate = "";
        $scope.endDate = "";
        $scope.outData = "";
        $scope.saveToFile = true;
        $scope.loading = false;
        $scope.startDateOpened = false;
        $scope.endDateOpened = false;

        $scope.submit = function() {
            if ($scope.gameId) {
                var sd = "";
                var ed = "";

                if($scope.startDate) {
                    sd = new Date($scope.startDate);
                    if( sd && sd.format ) {
                        sd = sd.format($scope.format);
                    }
                }

                if($scope.endDate) {
                    ed = new Date($scope.endDate);
                    if( ed && ed.format ) {
                        ed = ed.format($scope.format);
                    }
                }

                //console.log("startDate:", sd);
                //console.log("endDate:", ed);

                $scope.loading = true;
                $http({
                    method: 'GET',
                    url: '/api/game/'+$scope.gameId+'/events',
                    params: {
                        startDate:  sd,
                        endDate:    ed,
                        saveToFile: $scope.saveToFile
                    }
                }).success(function(data){
                    $scope.loading = false;

                    console.log("events data:", data);
                    $scope.outData = data.data;

                }).error(function(err){
                    console.error("parse-schema:", err);

                    $scope.loading = false;
                });
            }
        };

        $scope.today = function() {
            $scope.startDate = new Date();
        };
        $scope.today();

        $scope.clear = function () {
            $scope.startDate = null;
        };

        $scope.startDateOpen = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.startDateOpened = true;
        };
        $scope.endDateOpen = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.endDateOpened = true;
        };

        $scope.minDate = null;
        $scope.maxDate = new Date();
        $scope.dateOptions = {
            formatYear: 'yy',
            //startingDay: 1
        };

        $scope.format = 'yyyy-MM-dd';
  });
