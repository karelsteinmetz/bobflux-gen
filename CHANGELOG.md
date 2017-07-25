CHANGELOG
===

0.15.0
New Features
-

Added support for an isUndefinable flag in cursors. The isUndefinable means that value under the cursor can be undefined and the cursor will not be recognized as invalid.

0.14.0
New Features
-

Added support union & optional types

0.13.0
New Features
-

Fixed issues for TS 2.2

0.12.0
New Features
-

Added index as optional parameter in functional cursors of array.

0.11.0
New Features
-

Created state reexporting in all cursors and builders.
* eliminates batch of imports in your tests

0.10.0
New Features
-

Functional cursors.
* are being created for each IComponentState
* will help you when you create isolated Bobflux components which have instance of actions in own context
* are pure functions which have base state as parameter

0.9.0
New Features
-

Command for generating OData api service.

0.8.0
--

New Features
-

Support for generic types.

0.7.4
--

New Features
-

Support for classes.
Will be generated all classes which are used in states. Marker interfaces aren't necessary for classes. Rules for class are eqvivalent to IComponentState.