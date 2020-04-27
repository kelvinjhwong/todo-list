# To-dos tracker built with Node.js, Express.js, JavaScript, jQuery, Handlebars, HTML and CSS

## Instructions for running the app locally

1. Clone the repo
   ```
   $ git clone https://github.com/kelvinjhwong/todo-list.git
   ```
2. `cd` into the repo
   ```
   $ cd todo-list
   ```
3. Install dependencies with npm
   ```
   $ npm install
   ```
4. Start the web server
   ```
   $ npm start
   ```
5. Visit the app at `localhost:3000`

## Code structure - objects and main methods (excluding helper methods)

- `API` - methods that send AJAX requests to the server

  - `fetchAllTodos`

  - `createTodo`

  - `updateTodo`

  - `deleteTodo`

- `TodosManager` - methods for manipulating the collection of todo items in the cache

  - `todos` property - array of todos in the cache

  - `cache` - save todos to the cache when app initializes on page load

  - `create`

  - `getTodoById`

  - `update`

  - `delete`

  - `groupByDate` - group todos into object whose keys are the todos' due date strings

  - `completedTodos`

  - `incompleteTodos`

  - `reorderByCompletion` - return array of todos with the completed todos moved to the end

  - `todosCount`

  - `todosDueOn` - return array of todos for a given due date string

  - `completedTodosDueOn` - return array of completed todos for a given due date string

- `UI` - methods for modifying the UI

  - `render` - render the entire UI when app initializes on page load

  - `showEditTodoModal`

  - `hideEditTodoModal`

  - `addNewTodo`

  - `editTodo`

  - `updateTodo`

  - `removeTodo`

  - `updateCurrentSectionTitle` - re-render the list title and count of the currently displayed todo items in `main`

  - `renderList` - re-render the the currently displayed todo items in `main`

  - `isCompletedList` - determine whether a particular list of todo items is in the 'All Todos' section or the 'Completed' section of the `sidebar`

  - `highlightTitle` - find the list title of the currently displayed todo items on the `sidebar`, and highlight this list title on the `sidebar`

  - `reorderTodosByCompletion` - move completed todos to the bottom of the currently displayed todo items

  - `updateAllLists` - re-render the list titles in the 'All Todos' section of the `sidebar`

  - `updateCompletedLists` - re-render the list titles in the 'Completed' section of the `sidebar`

- `UIEventListeners` - event listeners with handlers that only modify the UI, and do not modify the cache or the back-end data store

  - `bind` - bind event handlers when app initializes on page load

  - `bindClickAddNewTodo`

  - `bindClickEditTodoModalLayer`

  - `bindClickEditTodo`

  - `bindClickListTitle`

- `AppEventListeners` - event listeners with handlers that modify the cache (i.e. interact with `TodosManager`) and the back-end data store (i.e. call `API`'s methods)

  - `bind` - bind event handlers when app initializes on page load

  - `bindSaveNewTodo`

  - `bindToggleCompleteTodo` - bind event handler for marking a todo as complete or incomplete through clicking the area surrounding a todo item's title

  - `bindCompleteTodo` - bind event handler for marking a todo as complete through the 'Mark As Complete' button on the todo modal

  - `bindUpdateTodo`

  - `bindDeleteTodo`

- `App`

  - `init` - initialize app on page load
