angular.module('pCombobox', []).directive('pCombobox', [function () {
  var templateString = '<div class="pCombobox">' +
    '        <input type="text" name="{{name}}" placeholder="{{placeholder}}" autocomplete="off" ng-model="inputValue"' +
    //'            ng-class="{{class}}"' +
    '            ng-required="isRequired" ng-change="inputChange()" ng-focus="inputFocus()" ng-blur="inputBlur($event)" input-dropdown-validator' +
    '            class="form-control" aria-label="..." />' +
    '            <ul ng-show="isOpen">' +
    '                <li ng-repeat="item in dropdownItems" ng-click="selectItem(item)" ng-mouseenter="setActive($index)" ng-mousedown="dropdownPressed()"' +
    '                    ng-class="{\'active\': activeIndex === $index}">' +
    '                    <span ng-if="item.readableName">{{item.readableName}}</span>' +
    '                    <span ng-if="!item.readableName">{{item}}</span>' +
    '                </li>' +
    '            </ul>' +
    '</div>';



  return {
    restrict: 'E',
    scope: {
      options: '=',
      selected: '=',
      allowCustomInput: '=',
      isRequired: '=',
      name: '@',
      class: '@',
      placeholder: '@',
      filter: '&',
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
      this.customInputAllowed = function () {
        return $scope.allowCustomInput;
      };
      this.getInput = function () {
        return $scope.inputValue;
      };

    }],
    link: function (scope, element) {
      var pressedDropdown = false;
      var inputScope = element.find('input').isolateScope();

      scope.activeIndex = 0;
      scope.inputValue = scope.selected;
      scope.isOpen = false;
      scope.dropdownItems = scope.options || [];

      scope.$watch('dropdownItems', function (newValue, oldValue) {
        if (!angular.equals(newValue, oldValue)) {
          // If new dropdownItems were retrieved, reset active item
          if (scope.allowCustomInput) {
            scope.setInputActive();
          }
          else {
            scope.setActive(0);
          }
        }
      });

      scope.$watch('selected', function (newValue, oldValue) {
        inputScope.updateInputValidity();

        if (!angular.equals(newValue, oldValue)) {
          if (newValue) {
            // Update value in input field to match readableName of selected item
            if (typeof newValue === 'string') {
              scope.inputValue = newValue;
            }
            else {
              scope.inputValue = newValue.readableName;
            }
          }
          else {
            // Uncomment to clear input field when editing it after making a selection
            // scope.inputValue = '';
          }
        }
      });

      scope.setInputActive = function () {
        scope.setActive(-1);

        //TODO: Add active/selected class to input field for styling
      };

      scope.setActive = function (itemIndex) {
        scope.activeIndex = itemIndex;
      };

      scope.inputChange = function () {
        scope.selected = null;
        showDropdown();

        if (!scope.inputValue) {
          scope.dropdownItems = scope.options || [];
          return;
        }
        else if (scope.allowCustomInput) {
          inputScope.updateInputValidity();
        }

        if (scope.filter) {
          var promise = scope.filter({ userInput: scope.inputValue });
          if (promise) {
            promise.then(function (dropdownItems) {
              scope.dropdownItems = dropdownItems;
            });
          }
        }
      };

      scope.inputFocus = function () {
        if (scope.allowCustomInput) {
          scope.setInputActive();
        }
        else {
          scope.setActive(0);
        }
        showDropdown();
      };

      scope.inputBlur = function (event) {
        if (pressedDropdown) {
          // Blur event is triggered before click event, which means a click on a dropdown item wont be triggered if we hide the dropdown list here.
          pressedDropdown = false;
          return;
        }
        hideDropdown();
      };

      scope.dropdownPressed = function () {
        pressedDropdown = true;
      };

      scope.selectItem = function (item) {
        scope.selected = item;
        hideDropdown();
        //scope.dropdownItems = [item];

        if (scope.onSelected) {
          scope.onSelected({ item: item });
        }
      };

      var showDropdown = function () {
        scope.isOpen = true;
      };
      var hideDropdown = function () {
        scope.isOpen = false;
      };

      var selectPreviousItem = function () {
        var prevIndex = scope.activeIndex - 1;
        if (prevIndex >= 0) {
          scope.setActive(prevIndex);
        }
        else if (scope.allowCustomInput) {
          scope.setInputActive();
        }
      };

      var selectNextItem = function () {
        var nextIndex = scope.activeIndex + 1;
        if (nextIndex < scope.dropdownItems.length) {
          scope.setActive(nextIndex);
        }
      };

      var selectActiveItem = function () {
        if (scope.activeIndex >= 0 && scope.activeIndex < scope.dropdownItems.length) {
          scope.selectItem(scope.dropdownItems[scope.activeIndex]);
        }
        else if (scope.allowCustomInput && scope.activeIndex === -1) {
          //TODO: Select user input. Do we need to call the controller here (ie scope.onSelected()) or is it enough to just leave the input value in the field?
        }
      };

      element.bind("keydown keypress", function (event) {
        switch (event.which) {
          case 38: //up
            scope.$apply(selectPreviousItem);
            break;
          case 40: //down
            scope.$apply(selectNextItem);
            break;
          case 13: // return
            if (scope.isOpen && scope.dropdownItems && scope.dropdownItems.length > 0 && scope.activeIndex !== -1) {
              // only preventDefault when there is a list so that we can submit form with return key after a selection is made
              event.preventDefault();
              scope.$apply(selectActiveItem);
            }
            break;
          case 9: // tab
            if (scope.isOpen && scope.dropdownItems && scope.dropdownItems.length > 0 && scope.activeIndex !== -1) {
              scope.$apply(selectActiveItem);
            }
            break;
        }
      });
    }
  }
}]);

angular.module('pCombobox').directive('inputDropdownValidator', function () {
  return {
    require: ['^pCombobox', 'ngModel'],
    restrict: 'A',
    scope: {},
    link: function (scope, element, attrs, ctrls) {
      var inputDropdownCtrl = ctrls[0];
      var ngModelCtrl = ctrls[1];
      var validatorName = 'itemSelectedValid';

      scope.updateInputValidity = function () {
        var selection = inputDropdownCtrl.getSelected();
        var isValid = false;

        if (!inputDropdownCtrl.isRequired()) {
          // Input isn't required, so it's always valid
          isValid = true;
        }
        else if (inputDropdownCtrl.customInputAllowed() && inputDropdownCtrl.getInput()) {
          // Custom input is allowed so we just need to make sure the input field isn't empty
          isValid = true;
        }
        else if (selection) {
          // Input is required and custom input is not allowed, so only validate if an item is selected
          isValid = true;
        }

        ngModelCtrl.$setValidity(validatorName, isValid);
      };
    }
  };
});