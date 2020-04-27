# Todo Lists application documentation

## HTML and CSS

* I used the provided HTML and CSS templates.

## Re-rendering UI templates vs directly manipulating DOM elements

* After each AJAX request, I chose to update the relevant parts of the UI by re-rendering entire Handlebars templates, rather than directly inserting, modifying or removing DOM elements.

  * So for example, after a todo item is deleted, these are all re-rendered:

    * All the list titles + their counts on the sidebar

    * The list title + count of the currently displayed todo items

    * The currently displayed list of todo items itself

* While this was the more convenient implementation and, for this application, sufficient to achieve the desired functionality, I also understand that it somewhat defeats the point of AJAX in the first place. So if I were to re-build the application, I would explore directly manipulating DOM elements instead.

## Object creation pattern choices

* I did not use a `Todo` constructor function for creating new todo items, and instead represented todo items using plain objects in the browser cache.

* Behaviours on the todo items are included as methods in the `TodosManager` collection object.

* I made this choice for this project because each todo item does not have many pieces of information or behaviours associated with it.

## Limitation in the back end

* Once a todo item's date (day/month/year) and description values have been set for the first time (either when the todo was first created, or later updated), I was unable to reset those values to empty again on the back end (unlike in the reference application).

* This was because the `PUT` endpoint for updating a todo item does not allow for this. I tried sending AJAX requests with the todo's date or description values set to `''`, `null`, `undefined` or `'Day'`/`'Month'`/`'Year'` (for the respective date fields), but none of these values could reset the date or description fields on the back end.

* This behaviour is different to that of the `POST` endpoint for creating a new todo item, for which a value of `''` for a date or description field would cause an empty value to be saved in the back end.

## Bug in the reference application

* Steps to reproduce bug:

  1. Create a todo item.

  2. Mark the todo item as completed.

  3. Click on the list title underneath the 'Completed' section in the `sidebar` whose list title is this todo item's due date string (e.g. ~~No Due Date~~ or ~~08/17~~).

  4. Change the todo item's month or year value, so that its due date string changes.

  5. The todo item immediately disappears from the currently displayed list, which is expected, but the count of the currently displayed list does NOT decrement in either the `sidebar`, or the currently displayed list title at the top of `main`.

* This bug only occurs when clicking on a list title within the 'Completed' section of the `sidebar`; it doesn't occur when clicking on a list title within the 'All Todos' section of the `sidebar`.

* I did not follow this behaviour in my application.

## Code structure - objects and main methods (excluding helper methods)

* `API` - methods that send AJAX requests to the server

  * `fetchAllTodos`

  * `createTodo`

  * `updateTodo`

  * `deleteTodo`

* `TodosManager` - methods for manipulating the collection of todo items in the cache

  * `todos` property - array of todos in the cache

  * `cache` - save todos to the cache when app initializes on page load

  * `create`

  * `getTodoById`

  * `update`

  * `delete`

  * `groupByDate` - group todos into object whose keys are the todos' due date strings

  * `completedTodos`

  * `incompleteTodos`

  * `reorderByCompletion` - return array of todos with the completed todos moved to the end

  * `todosCount`

  * `todosDueOn` - return array of todos for a given due date string

  * `completedTodosDueOn` - return array of completed todos for a given due date string

* `UI` - methods for modifying the UI

  * `render` - render the entire UI when app initializes on page load

  * `showEditTodoModal`

  * `hideEditTodoModal`

  * `addNewTodo`

  * `editTodo`

  * `updateTodo`

  * `removeTodo`

  * `updateCurrentSectionTitle` - re-render the list title and count of the currently displayed todo items in `main`

  * `renderList` - re-render the the currently displayed todo items in `main`

  * `isCompletedList` - determine whether a particular list of todo items is in the 'All Todos' section or the 'Completed' section of the `sidebar`

  * `highlightTitle` - find the list title of the currently displayed todo items on the `sidebar`, and highlight this list title on the `sidebar`

  * `reorderTodosByCompletion` - move completed todos to the bottom of the currently displayed todo items

  * `updateAllLists` - re-render the list titles in the 'All Todos' section of the `sidebar`

  * `updateCompletedLists` - re-render the list titles in the 'Completed' section of the `sidebar`

* `UIEventListeners` - event listeners with handlers that only modify the UI, and do not modify the cache or the back-end data store

  * `bind` - bind event handlers when app initializes on page load

  * `bindClickAddNewTodo`

  * `bindClickEditTodoModalLayer`

  * `bindClickEditTodo`

  * `bindClickListTitle`

* `AppEventListeners` - event listeners with handlers that modify the cache (i.e. interact with `TodosManager`) and the back-end data store (i.e. call `API`'s methods)

  * `bind` - bind event handlers when app initializes on page load

  * `bindSaveNewTodo`

  * `bindToggleCompleteTodo` - bind event handler for marking a todo as complete or incomplete through clicking the area surrounding a todo item's title

  * `bindCompleteTodo` - bind event handler for marking a todo as complete through the 'Mark As Complete' button on the todo modal

  * `bindUpdateTodo`

  * `bindDeleteTodo`

* `App`

  * `init` - initialize app on page load
