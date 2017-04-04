angular.module('pCombobox', []).directive('pCombobox', [function () {
    var templateString = '<div class="pCombobox">' +
        '        <input type="text" name="{{name}}" placeholder="{{placeholder}}" autocomplete="off" ng-model="search"' +
        '            class="{{cssClass}}"' +
        '            ng-required="isRequired" ng-change="events.change()" ng-focus="events.focus()" ng-blur="events.blur($event)" p-combobox-validator' +
        '            class="form-control" />' +
        '            <ul ng-show="isOpen">' +
        '                <li ng-repeat="item in options" ng-click="events.select(item)" ng-mouseenter="events.mouseenter($index)" ng-mousedown="events.mousedown()"' +
        '                    ng-class="{\'pCombobox-active\': activeIndex === $index}">' +
        '                    <span ng-if="item.readableName">{{item.readableName}}</span>' +
        '                    <span ng-if="!item.readableName">{{item}}</span>' +
        '                </li>' +
        '            </ul>' +
        '</div>';

    return {
        restrict: 'E',
        //tranclude: true,
        scope: {
            options: '=',
            selected: '=',
            isRequired: '=?',
            name: '@',
            cssClass: '@',
            placeholder: '@',
            filter: '&', // Filter should always return a promise
            onSelected: '&'
        },
        template: templateString,
        controller: ['$scope', function ($scope) {

            this.getSelected = function () {
                return $scope.selected;
            };
            this.isRequired = function () {
                return $scope.isRequired;
            };

            this.getSearch = function () {
                return $scope.search;
            };

        }],

        link: function (scope, element, attr, ctrls) {
            var activeIndex = 0,
                isOpen = false,
                itemSelecting = false;

            scope.name = scope.name || Date.now();
            scope.isRequired = scope.isRequired || false;
            scope.search = scope.selected;
            var _options = scope.options || [];

            scope.events = {
                change: function () {
                    pvt.openPopup();
                    pvt.setActive(-1);
                    scope.selected = scope.search;
                    pvt.updateValidation();
                },
                focus: function () {
                    var index = pvt.findIndex(scope.search);
                    if (index >= 0) {
                        pvt.setActive(index);
                    }

                    pvt.openPopup();
                },
                blur: function () {
                    if (itemSelecting) {
                        // Blur event is triggered before click event, which means a click on a dropdown item wont be triggered if we hide the dropdown list here.
                        itemSelecting = false;
                        return;
                    }
                    pvt.closePopup();
                },
                mousedown: function () {
                    itemSelecting = true;
                },
                mouseenter: function (index) {
                    pvt.setActive(index);
                },
                select: function (item) {
                    item = item || null; // making sure null

                    scope.selected = item;
                    scope.search = item;
                    pvt.closePopup()
                    pvt.updateValidation();

                    if (scope.onSelected && angular.isFunction(scope.onSelected())) {
                        scope.onSelected()(item);
                    }
                }
            };

            element.bind("keydown", function (event) {
                switch (event.which) {
                    case 27: //escape
                        scope.$apply(pvt.closePopup);
                        break;
                    case 38: //up
                        scope.$apply(pvt.up);
                        break;
                    case 40: //down
                        scope.$apply(pvt.down);
                        break;
                    case 13: // return
                        // preventDefault event so that the submit form wrapping this control does not get submitted.
                        event.preventDefault();
                        scope.$apply(pvt.selectActiveItem);
                        break;
                    case 9: // tab
                        scope.$apply(pvt.selectActiveItem);
                        break;
                }
            });

            var pvt = {
                openPopup: function () {
                    scope.isOpen = true;
                },
                closePopup: function () {
                    scope.isOpen = false;
                },
                up: function () {
                    if (!scope.isOpen)
                        return;

                    var upIndex = scope.activeIndex - 1;
                    if (upIndex >= 0) {
                        pvt.setActive(upIndex);
                    }
                    else {
                        pvt.setActive(scope.options.length - 1);
                    }
                },
                down: function () {
                    if (!scope.isOpen)
                        return;
                    var downIndex = scope.activeIndex + 1;
                    if (downIndex < scope.options.length) {
                        pvt.setActive(downIndex);
                    } else {
                        pvt.setActive(0);
                    }

                },
                setActive: function (index) {
                    scope.activeIndex = index;
                },
                selectActiveItem: function () {
                    if (scope.activeIndex >= 0 && scope.activeIndex < scope.options.length) {
                        scope.events.select(scope.options[scope.activeIndex]);
                    }
                    else if (scope.activeIndex === -1) {
                        scope.events.select(scope.search);
                    }
                },
                findIndex: function (item) {
                    if (!item)
                        return -1;
                    item = item.toLowerCase();
                    for (var i = 0; i < scope.options.length; i++) {
                        if (scope.options[i].toLowerCase() === item)
                            return i;
                    }
                    return -1;
                },
                updateValidation: function () {
                    var searchScope = element.find('input').isolateScope();
                    if (searchScope && searchScope.udpateValidation) {
                        searchScope.updateValidation();
                    }
                }
            }

        }
    }
}]);

angular.module('pCombobox')
    .directive('pComboboxValidator', function () {
        return {
            require: ['^pCombobox', 'ngModel'],
            restrict: 'A',
            scope: {},
            link: function (scope, element, attrs, ctrls) {
                var pCtrl = ctrls[0];
                var ngModelCtrl = ctrls[1];
                scope.updateValidation = function () {
                    var selected = pCtrl.getSelected();
                    var isValid = false;

                    if (!pCtrl.isRequired() || pCtrl.getSearch() || selected) {
                        isValid = true;
                    }
                    ngModelCtrl.$setValidity('pComboboxValid', isValid);
                };
            }
        };
    });