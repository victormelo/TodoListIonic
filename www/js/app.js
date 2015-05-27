// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var todoApp = angular.module('starter', ['ionic', 'ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

todoApp.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('config', {
            url: '/config',
            templateUrl: 'templates/config.html',
            controller: 'ConfigController'
        })
        .state('categories', {
            url: '/categories',
            templateUrl: 'templates/categories.html',
            controller: 'CategoriesController'
        })
        .state('lists', {
            url: '/lists/:categoryId',
            templateUrl: 'templates/lists.html',
            controller: 'ListsController'
        })
        .state('items', {
            url: "/items/:listId",
            templateUrl: "templates/items.html",
            controller: "ItemsController"
        });
    $urlRouterProvider.otherwise('/config');
});

var db = null;

todoApp.controller("ConfigController", function($scope, $ionicPlatform, $ionicLoading, $location, $ionicHistory, $cordovaSQLite) {
    $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
    });
    $ionicPlatform.ready(function() {
        $ionicLoading.show({ template: 'Loading...' });
        if(window.cordova) {
            window.plugins.sqlDB.copy("populated.db", function() {
                db = $cordovaSQLite.openDB("populated.db");
                $location.path("/categories");
                $ionicLoading.hide();
            }, function(error) {
                console.error("There was an error copying the database: " + error);
                db = $cordovaSQLite.openDB("populated.db");
                $location.path("/categories");
                $ionicLoading.hide();
            });
        } else {
            db = openDatabase("websql.db", '1.0', "My WebSQL Database", 2 * 1024 * 1024);
            db.transaction(function (tx) {
                tx.executeSql("DROP TABLE IF EXISTS Category");
                tx.executeSql("CREATE TABLE IF NOT EXISTS Category (id integer primary key, name text)");
                tx.executeSql("CREATE TABLE IF NOT EXISTS TodoList (id integer primary key, category_id integer, name text)");
                tx.executeSql("CREATE TABLE IF NOT EXISTS TodoListItem (id integer primary key, todo_list_id integer, name text)");
                tx.executeSql("INSERT INTO Category (name) VALUES (?)", ["Faculdade"]);
                tx.executeSql("INSERT INTO Category (name) VALUES (?)", ["Casa"]);
                tx.executeSql("INSERT INTO Category (name) VALUES (?)", ["Projeto"]);
                tx.executeSql("INSERT INTO Category (name) VALUES (?)", ["Freelas"]);
            });
            $location.path("/categories");
            $ionicLoading.hide();
        }
    });
});

todoApp.controller("CategoriesController", function($scope, $ionicPlatform, $cordovaSQLite) {

    $scope.categories = [];

    // This is because we cannot try to query the database until our plugins are ready.
    $ionicPlatform.ready(function() {
        var query = "SELECT id, name FROM Category";
        $cordovaSQLite.execute(db, query, []).then(function(res) {
            if(res.rows.length > 0) {
                for(var i = 0; i < res.rows.length; i++) {
                    $scope.categories.push({id: res.rows.item(i).id, name: res.rows.item(i).name});
                }
            }
        }, function (err) {
            console.error(err);
        });
    });

});

todoApp.controller("ListsController", function($scope, $ionicPlatform, $ionicPopup, $cordovaSQLite, $stateParams) {

    $scope.lists = [];

    $ionicPlatform.ready(function() {
        var query = "SELECT id, category_id, name FROM TodoList where category_id = ?";
        $cordovaSQLite.execute(db, query, [$stateParams.categoryId]).then(function(res) {
            if(res.rows.length > 0) {
                for(var i = 0; i < res.rows.length; i++) {
                    $scope.lists.push({id: res.rows.item(i).id, category_id: res.rows.item(i).category_id, name: res.rows.item(i).name});
                }
            }
        }, function (err) {
            console.error(err);
        });
    });

    $scope.insert = function() {
        $ionicPopup.prompt({
            title: 'Enter a new TODO list',
            inputType: 'text'
        })
        .then(function(result) {
            if(result !== undefined) {
                var query = "INSERT INTO TodoList (category_id, name) VALUES (?,?)";
                $cordovaSQLite.execute(db, query, [$stateParams.categoryId, result]).then(function(res) {
                    $scope.lists.push({id: res.insertId, category_id: $stateParams.categoryId, name: result});
                }, function (err) {
                    console.error(err);
                });
            } else {
                console.log("Action not completed");
            }
        });
    }

});

todoApp.controller("ItemsController", function($scope, $ionicPlatform, $ionicPopup, $cordovaSQLite, $stateParams) {

    $scope.items = [];

    $ionicPlatform.ready(function() {
        var query = "SELECT id, todo_list_id, name FROM TodoListItem where todo_list_id = ?";
        $cordovaSQLite.execute(db, query, [$stateParams.listId]).then(function(res) {
            if(res.rows.length > 0) {
                for(var i = 0; i < res.rows.length; i++) {
                    $scope.items.push({id: res.rows.item(i).id, todo_list_id: res.rows.item(i).todo_list_id, name: res.rows.item(i).name});
                }
            }
        }, function (err) {
            console.error(err);
        });
    });

    $scope.insert = function() {
        $ionicPopup.prompt({
            title: 'Enter a new TODO Item',
            inputType: 'text'
        })
        .then(function(result) {
            if(result !== undefined) {
                var query = "INSERT INTO TodoListItem (todo_list_id, name) VALUES (?,?)";
                $cordovaSQLite.execute(db, query, [$stateParams.listId, result]).then(function(res) {
                    $scope.items.push({id: res.insertId, todo_list_id: $stateParams.listId, name: result});
                }, function (err) {
                    console.error(err);
                });
            } else {
                console.log("Action not completed");
            }
        });
    }

    $scope.delete = function(item) {
        var query = "DELETE FROM TodoListItem where id = ?";
        $cordovaSQLite.execute(db, query, [item.id]).then(function(res) {
            $scope.items.splice($scope.items.indexOf(item), 1);
        }, function (err) {
            console.error(err);
        });
    }

});
