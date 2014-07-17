'use strict';

/**
 * @ngdoc function
 * @name staticApp.controller:EditcsvCtrl
 * @description
 * # EditcsvCtrl
 * Controller of the staticApp
 */
angular.module('staticApp')
  .controller('EditcsvCtrl', function ($scope, $http) {
        $scope.gameId = "aa-1";
        $scope.csvData = "";
        $scope.loading = true;

        $scope.selectGame = function() {
            console.log("gameId:", $scope.gameId);
            getCSVData($scope.gameId);
        };

        $scope.submit = function() {
            if ($scope.gameId) {
                $scope.loading = true;
                $http({
                    method: 'POST',
                    url: '/api/game/'+$scope.gameId+'/parse-schema',
                    data: {
                        data: $scope.csvData
                    }
                }).success(function(){
                    $scope.loading = false;
                }).error(function(){
                    console.error("parse-schema:", err);
                });
            }
        };

        function getCSVData(gameId){
            $scope.loading = true;
            $http({
                method: 'GET',
                url: '/api/game/'+gameId+'/parse-schema'
            }).success(function(data){
                $scope.loading = false;
                $scope.csvData = data;
            }).error(function(err){
                console.error("parse-schema:", err);
            });
        }

        getCSVData($scope.gameId);
  });
