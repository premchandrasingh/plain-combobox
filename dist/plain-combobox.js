/*!
* plain-combobox 1.0.6
* https://github.com/premchandrasingh/plain-combobox
* Copyright 2018 @ Prem
* Contributors :- Prem <premchandrasingh@gmail.com>
* Licensed under: MIT (http://www.opensource.org/licenses/MIT)
*/

(function (angular) {
    'use strict';
    angular.module('pCombobox', [])
        .directive('pCombobox', ['$window', '$timeout', function ($window, $timeout) {
            var templateString = '<div class="pCombobox">' +
                '        <input type="text" name="{{name}}" placeholder="{{placeholder}}" autocomplete="off" ng-model="search"' +
                '            class="{{cssClass}}" ng-disabled="isDisabled"' +
                '            ng-required="isRequired" ng-change="events.change()" ng-focus="events.focus()" ng-blur="events.blur($event)" p-combobox-validator />' +
                '            maxlength="{{:: maxLength != 0 ? maxLength : -1 }}" />' +
                '            <ul ng-show="isOpen">' +
                '                <li ng-repeat="item in $options" ng-click="events.select(item)" ng-mouseenter="events.mouseenter($index)" ng-mousedown="events.mousedown()"' +
                '                    ng-class="{\'pCombobox-active\': activeIndex === $index}">' +
                '                    <span ng-if="!oneWay && item.readableName">{{item.readableName}}</span>' +
                '                    <span ng-if="!oneWay && !item.readableName">{{item}}</span>' +
                '                    <span ng-if="oneWay && item.readableName">{{::item.readableName}}</span>' +
                '                    <span ng-if="oneWay && !item.readableName">{{::item}}</span>' +
                '                </li>' +
                '            </ul>' +
                '</div>';

            return {
                restrict: 'E',
                //tranclude: true,
                scope: {
                    options: '=',
                    optionsOneWay: '&',
                    selected: '=',
                    isRequired: '=?',
                    isDisabled: '=?',
                    name: '@',
                    cssClass: '@',
                    placeholder: '@',
                    filter: '&', // Filter should always return a promise
                    onSelected: '&',
                    inputFormat: '@',
                    maxLength: '@'
                },
                template: templateString,
                controller: ['$scope', function ($scope) {

                    $scope.$watch(function () {
                        return $scope.selected;
                    }, function (newVal, oldVal) {
                        $scope.search = newVal;
                    });

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
                    scope.isDisabled = scope.isDisabled || false;
                    scope.search = scope.selected;

                    if (scope.options) {
                        scope.$options = scope.options;
                        scope.oneWay = false;
                    }
                    else {
                        scope.$options = scope.optionsOneWay();
                        if (scope.$options)
                            scope.oneWay = true;
                    }
                    scope.$options = scope.$options || [];


                    // scope.$watch(function () {
                    //     return scope.options;
                    // }, function (newVal, oldVal) {
                    //     if (!angular.equals(newVal, _options)) {
                    //         console.log(newVal);
                    //     }
                    // });


                    scope.events = {
                        change: function () {
                            pvt.openPopup();
                            pvt.setActive(-1);
                            scope.selected = scope.search;
                            if (!pvt.updateValidation()) {
                                scope.selected = null;
                            } else if (scope.onSelected && angular.isFunction(scope.onSelected())) {
                                scope.onSelected()(scope.selected);
                            }
                        },
                        focus: function () {
                            var index = pvt.findIndex(scope.search);
                            if (index >= 0) {
                                pvt.setActive(index);
                            } else {
                                pvt.setActive(-1);
                            }

                            pvt.openPopup();
                            $timeout(function () {
                                pvt.updateDropPosition();
                                pvt.scrollToSelection();
                            });

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


                    var angularUl = element.find('ul'),
                        angularEle = element.find('input');

                    var pvt = {
                        openPopup: function () {
                            scope.isOpen = true;
                        },
                        closePopup: function () {
                            scope.isOpen = false;
                            angularUl.removeClass("pCombobox-reverse");
                        },
                        up: function () {
                            if (!scope.isOpen)
                                return;

                            var upIndex = scope.activeIndex - 1;
                            if (upIndex >= 0) {
                                pvt.setActive(upIndex);
                            }
                            else {
                                pvt.setActive(scope.$options.length - 1);
                            }
                        },
                        down: function () {
                            if (!scope.isOpen)
                                return;
                            var downIndex = scope.activeIndex + 1;
                            if (downIndex < scope.$options.length) {
                                pvt.setActive(downIndex);
                            } else {
                                pvt.setActive(0);
                            }

                        },
                        setActive: function (index) {
                            scope.activeIndex = index;
                        },
                        selectActiveItem: function () {
                            if (scope.activeIndex >= 0 && scope.activeIndex < scope.$options.length) {
                                scope.events.select(scope.$options[scope.activeIndex]);
                            }
                            else if (scope.activeIndex === -1) {
                                scope.events.select(scope.search);
                            }
                        },
                        findIndex: function (item) {
                            if (!item)
                                return -1;
                            if (typeof item == 'string')
                                item = item.toLowerCase();

                            for (var i = 0; i < scope.$options.length; i++) {
                                if ((typeof scope.$options[i] == 'string' && scope.$options[i].toLowerCase() === item)
                                    || scope.$options[i] === item)
                                    return i;
                            }
                            return -1;
                        },
                        updateValidation: function () {
                            var isValid = false;
                            var searchScope = element.find('input').isolateScope();
                            if (searchScope && searchScope.updateValidation) {
                                isValid = searchScope.updateValidation();
                            } else {
                                isValid = _isValid(scope.isRequired, scope.search, scope.selected, scope.inputFormat);
                            }
                            if (isValid) {
                                angularEle.removeClass('pCombobox-invalid');
                            } else {
                                angularEle.addClass('pCombobox-invalid');
                            }
                            return isValid;
                        },
                        updateDropPosition: function () {
                            var eleOffset = pvt.offset(angularEle[0])
                            var eleHeight = angularUl[0].offsetHeight;
                            var windowHeight = $window.innerHeight;

                            if (eleOffset.top > windowHeight / 2) {
                                angularUl.addClass("pCombobox-reverse");
                                //angularUl.prop('style', 'top:-' + eleHeight + 'px');
                            }
                            else {
                                angularUl.removeClass("pCombobox-reverse");
                                //angularUl.prop('style', '');
                            }
                        },
                        scrollToSelection: function () {
                            $timeout(function () {
                                if (angularUl && scope.activeIndex > -1) {
                                    var target = angularUl[0].querySelector('.pCombobox-active');
                                    if (target && target.parentNode) {
                                        var eleHeight = angularUl[0].offsetHeight;
                                        var factor = Math.max(eleHeight / 2, 50); // try to scoll in the middle
                                        target.parentNode.scrollTop = target.offsetTop - factor;
                                    }
                                }
                            }, 10);

                        },
                        offset: function (elem) {
                            // copied from offset function of https://github.com/jquery/jquery/blob/master/src/offset.js
                            if (!elem) {
                                return;
                            }
                            var doc, docElem, rect, win;
                            // Return zeros for disconnected and hidden (display: none) elements (gh-2310)
                            // Support: IE <=11 only
                            // Running getBoundingClientRect on a
                            // disconnected node in IE throws an error
                            if (!elem.getClientRects().length) {
                                return { top: 0, left: 0 };
                            }

                            rect = elem.getBoundingClientRect();
                            doc = elem.ownerDocument;
                            docElem = doc.documentElement;
                            win = doc.defaultView;
                            return {
                                top: rect.top + win.pageYOffset - docElem.clientTop,
                                left: rect.left + win.pageXOffset - docElem.clientLeft
                            };

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
                        var isValid = _isValid(pCtrl.isRequired(), pCtrl.getSearch(), pCtrl.getSelected(), scope.$parent.inputFormat);
                        ngModelCtrl.$setValidity('pComboboxValid', isValid);
                        return isValid;
                    };
                }
            };
        });

    function _isValid(isRequired, input, selectedValue, regExp) {
        var isValid = false;

        if (!isRequired || input || selectedValue) {
            isValid = true;
        }

        if (isValid &&
            selectedValue &&
            regExp
            && !new RegExp(regExp, 'i').test(selectedValue)) {
            isValid = false;
        }

        return isValid;
    }
})(angular)