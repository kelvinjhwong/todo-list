$(() => {
  const API = {
    fetchAllTodos() {
      return $.ajax({
        type: 'get',
        url: '/api/todos',
        dataType: 'json',
      });
    },

    createTodo(newTodoJSON) {
      return $.ajax({
        type: 'post',
        url: '/api/todos',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(newTodoJSON),
      });
    },

    updateTodo(todoId, updatedTodoJSON) {
      return $.ajax({
        type: 'put',
        url: `/api/todos/${todoId}`,
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(updatedTodoJSON),
      });
    },

    deleteTodo(todoId) {
      return $.ajax({
        type: 'delete',
        url: `/api/todos/${todoId}`,
      });
    },
  };

  const TodosManager = (() => {
    function updateDueDate(todo) {
      if (todo.month === '' || todo.year === '') {
        todo.due_date = 'No Due Date';
      } else {
        todo.due_date = `${todo.month}/${todo.year.slice(2)}`;
      }
    }

    function sortByDate(todos) {
      return todos.slice().sort((todo1, todo2) => {
        const yearComparison = Number(todo1.year) - Number(todo2.year);
        const monthComparison = Number(todo1.month) - Number(todo2.month);

        return yearComparison || monthComparison;
      });
    }

    return {
      todos: null,

      cache(todosJSON) {
        this.todos = todosJSON;
        this.todos.forEach(updateDueDate);
      },

      create(todoJSON) {
        updateDueDate(todoJSON);
        this.todos.push(todoJSON);

        return todoJSON;
      },

      getTodoById(todoId) {
        return this.todos.find((todo) => todo.id === todoId);
      },

      update(todoJSON) {
        let i;
        const todosCount = this.todosCount();

        updateDueDate(todoJSON);

        for (i = 0; i < todosCount; i += 1) {
          if (this.todos[i].id === todoJSON.id) {
            this.todos.splice(i, 1, todoJSON);
            return;
          }
        }
      },

      delete(todoId) {
        let i;
        const todosCount = this.todosCount();

        for (i = 0; i < todosCount; i += 1) {
          if (this.todos[i].id === todoId) {
            this.todos.splice(i, 1);
            return;
          }
        }
      },

      groupByDate(todos) {
        let todosByDate = {};

        sortByDate(todos).forEach((todo) => {
          const dueDate = todo.due_date;

          todosByDate[dueDate] = todosByDate[dueDate] || [];
          todosByDate[dueDate].push(todo);
        });

        return todosByDate;
      },

      completedTodos() {
        return this.todos.filter((todo) => todo.completed);
      },

      incompleteTodos() {
        return this.todos.filter((todo) => !todo.completed);
      },

      reorderByCompletion() {
        return this.incompleteTodos().concat(this.completedTodos());
      },

      todosCount() {
        return this.todos.length;
      },

      todosDueOn(dueDate) {
        return this.todos.filter((todo) => todo.due_date === dueDate);
      },

      completedTodosDueOn(dueDate) {
        return this.completedTodos().filter((todo) => todo.due_date === dueDate);
      },
    };
  })();

  const UI = (() => {
    let templates = {};

    function compileTemplates() {
      const $templateScripts = $('script[type="text/x-handlebars-template"]');

      $templateScripts.each((_, script) => {
        const $script = $(script);

        templates[$script.attr('id')] = Handlebars.compile($script.html());
      });

      $templateScripts.filter('[data-type="partial"]').each((_, script) => {
        const $script = $(script);

        Handlebars.registerPartial($script.attr('id'), $script.html());
      });
    }

    return {
      render() {
        compileTemplates();

        const mainTemplateHTML = templates.main_template({
          todos: TodosManager.todos,
          todos_by_date: TodosManager.groupByDate(TodosManager.todos),
          done: TodosManager.completedTodos(),
          done_todos_by_date: TodosManager.groupByDate(TodosManager.completedTodos()),
          current_section: { title: 'All Todos', data: TodosManager.todosCount() },
          selected: TodosManager.todos,
        });

        $(document.body).prepend(mainTemplateHTML);

        this.wrapElementsWithjQuery();

        this.highlightTitle({
          listTitle: 'All Todos',
          isCompletedList: false,
        });

        this.reorderTodosByCompletion();
      },

      wrapElementsWithjQuery() {
        this.$sidebar = $('#sidebar');
        this.$allTodosHeaderContainer = $('#all_todos');
        this.$allLists = $('#all_lists');
        this.$completedTodosHeaderContainer = $('#completed_todos');
        this.$completedLists = $('#completed_lists');
        this.$currentSectionHeader = $('#items header');
        this.$todosList = $('#items table tbody');
        this.$addNewTodoButton = $('label[for="new_item"]');
        this.$editTodoModal = $('#form_modal');
        this.$editTodoModalLayer = $('#modal_layer');
        this.$editTodoForm = $('#form_modal form');
        this.$todoTitleInput = $('input#title');
        this.$markTodoCompleteButton = $('#form_modal form button[name="complete"]');
      },

      showEditTodoModal() {
        this.$editTodoModal.fadeIn();
        this.$editTodoModalLayer.fadeIn();

        this.$todoTitleInput.focus();
      },

      hideEditTodoModal({ fadeOut }) {
        if (fadeOut) {
          this.$editTodoModal.fadeOut();
          this.$editTodoModalLayer.fadeOut(() => {
            this.$editTodoForm.get(0).reset();
          });
        } else {
          this.$editTodoModal.hide();
          this.$editTodoModalLayer.hide();
          this.$editTodoForm.get(0).reset();
        }

        this.$editTodoForm.removeAttr('data-todo-id');
      },

      addNewTodo() {
        this.hideEditTodoModal({ fadeOut: false });

        this.updateAllLists();

        this.$sidebar.find('[data-title="All Todos"]').trigger('click');
      },

      editTodo(todoId) {
        this.prefillTodoModal(todoId);
        this.showEditTodoModal();
      },

      updateTodo() {
        const $activeTitle = this.$sidebar.find('.active');
        const activeListTitle = $activeTitle.attr('data-title');
        const currentListTitleAndCompletion = {
          listTitle: activeListTitle,
          isCompletedList: this.isCompletedList($activeTitle),
        };

        this.hideEditTodoModal({ fadeOut: false });

        this.updateAllLists();
        this.updateCompletedLists();
        this.highlightTitle(currentListTitleAndCompletion);

        this.updateCurrentSectionTitle(currentListTitleAndCompletion);

        this.renderList(currentListTitleAndCompletion);

        this.reorderTodosByCompletion();
      },

      removeTodo($todo) {
        const $activeTitle = this.$sidebar.find('.active');
        const activeListTitle = $activeTitle.attr('data-title');
        const currentListTitleAndCompletion = {
          listTitle: activeListTitle,
          isCompletedList: this.isCompletedList($activeTitle),
        };

        this.updateAllLists();
        this.updateCompletedLists();
        this.highlightTitle(currentListTitleAndCompletion);

        this.updateCurrentSectionTitle(currentListTitleAndCompletion);

        $todo.remove();
      },

      updateCurrentSectionTitle({ listTitle, isCompletedList }) {
        const newCurrentSectionTitleHTML = templates.title_template({
          current_section: {
            title: listTitle,
            data: (() => {
              switch (listTitle) {
                case 'All Todos':
                  return TodosManager.todosCount();

                case 'Completed':
                  return TodosManager.completedTodos().length;

                default:
                  if (isCompletedList) {
                    return TodosManager.completedTodosDueOn(listTitle).length;
                  } else {
                    return TodosManager.todosDueOn(listTitle).length;
                  }
              }
            })(),
          },
        });

        this.$currentSectionHeader
          .empty()
          .append(newCurrentSectionTitleHTML);
      },

      renderList({ listTitle, isCompletedList }) {
        const newTodosHTML = templates.list_template({
          selected: (() => {
            switch (listTitle) {
              case 'All Todos':
                return TodosManager.todos;

              case 'Completed':
                return TodosManager.completedTodos();

              default:
                if (isCompletedList) {
                  return TodosManager.completedTodosDueOn(listTitle);
                } else {
                  return TodosManager.todosDueOn(listTitle);
                }
            }
          })(),
        });

        this.$todosList.html(newTodosHTML);

        this.reorderTodosByCompletion();
      },

      isCompletedList($listTitle) {
        const $listTitleParents = $listTitle.parents();

        if ($listTitleParents.is('#all')) {
          return false;
        } else if ($listTitleParents.is('#completed_items')) {
          return true;
        }
      },

      highlightTitle({ listTitle, isCompletedList }) {
        const $allTitles = this.$sidebar.find('[data-title]');
        const $targetTitle = (() => {
          if (isCompletedList) {
            return $allTitles.filter(`#completed_items [data-title="${listTitle}"]`);
          } else {
            return $allTitles.filter(`#all [data-title="${listTitle}"]`);
          }
        })();

        $allTitles.removeClass('active');
        $targetTitle.addClass('active');
      },

      reorderTodosByCompletion() {
        const $todoItems = this.$todosList.children('tr');

        TodosManager.reorderByCompletion().forEach((todo) => {
          const $todo = $todoItems.filter((_, todoItem) => {
            return Number($(todoItem).attr('data-id')) === todo.id;
          });

          this.$todosList.append($todo);
        });
      },

      updateAllLists() {
        const newAllTodosHeaderHTML = templates.all_todos_template({
          todos: TodosManager.todos,
        });

        const newListTitlesHTML = templates.all_list_template({
          todos_by_date: TodosManager.groupByDate(TodosManager.todos),
        });

        this.$allTodosHeaderContainer.html(newAllTodosHeaderHTML);

        this.$allLists.html(newListTitlesHTML);
      },

      updateCompletedLists() {
        const newCompletedTodosHeaderHTML = templates.completed_todos_template({
          done: TodosManager.completedTodos(),
        });

        const newCompletedListTitlesHTML = templates.completed_list_template({
          done_todos_by_date: TodosManager.groupByDate(TodosManager.completedTodos()),
        });

        this.$completedTodosHeaderContainer.html(newCompletedTodosHeaderHTML);

        this.$completedLists.html(newCompletedListTitlesHTML);
      },

      prefillTodoModal(todoId) {
        const todo = TodosManager.getTodoById(todoId);

        Object.keys(todo).forEach((key) => {
          if (key === 'id') {
            this.$editTodoForm.attr('data-todo-id', todo[key]);
          } else if (todo[key]) {
            const $todoFormInput = this.$editTodoForm.find(`[name="${key}"]`);

            $todoFormInput.val(todo[key]);
          }
        });
      },
    };
  })();

  const UIEventListeners = {
    bind() {
      this.bindClickAddNewTodo();
      this.bindClickEditTodoModalLayer();
      this.bindClickEditTodo();
      this.bindClickListTitle();
    },

    bindClickAddNewTodo() {
      UI.$addNewTodoButton.on('click', () => {
        UI.showEditTodoModal();

        AppEventListeners.bindSaveNewTodo();
      });
    },

    bindClickEditTodoModalLayer() {
      UI.$editTodoModalLayer.on('click', () => {
        UI.hideEditTodoModal({ fadeOut: true });
      });
    },

    bindClickEditTodo() {
      UI.$todosList.on('click', 'label', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const $todoTitle = $(e.target);
        const todoId = Number($todoTitle.attr('for').match(/[0-9]+$/)[0]);

        UI.editTodo(todoId);

        AppEventListeners.bindUpdateTodo();
      });
    },

    bindClickListTitle() {
      UI.$sidebar.on('click', '[data-title]', (e) => {
        const $clickedTitle = $(e.currentTarget);
        const clickedTitleString = $clickedTitle.attr('data-title');

        const listTitleAndCompletion = {
          listTitle: clickedTitleString,
          isCompletedList: UI.isCompletedList($clickedTitle),
        };

        UI.highlightTitle(listTitleAndCompletion);

        UI.updateCurrentSectionTitle(listTitleAndCompletion);

        UI.renderList(listTitleAndCompletion);
      });
    },
  };

  const AppEventListeners = (() => {
    function serializeTodoData($editTodoForm) {
      const arrayData = $editTodoForm.serializeArray();
      const todoJSON = convertArrayToJSON(arrayData);

      handleEmptyDateValues(todoJSON);

      return todoJSON;
    }

    function convertArrayToJSON(array) {
      let json = {};

      array.forEach((pair) => {
        json[pair.name] = pair.value;
      });

      return json;
    }

    function handleEmptyDateValues(todoJSON) {
      if (todoJSON.day === 'Day') {
        todoJSON.day = '';
      }

      if (todoJSON.month === 'Month') {
        todoJSON.month = '';
      }

      if (todoJSON.year === 'Year') {
        todoJSON.year = '';
      }
    }

    return {
      bind() {
        this.bindToggleCompleteTodo();
        this.bindCompleteTodo();
        this.bindDeleteTodo();
      },

      bindSaveNewTodo() {
        UI.$editTodoForm.off('submit').on('submit', (e) => {
          e.preventDefault();

          if (UI.$todoTitleInput.val().length < 3) {
            alert('You must enter a title at least 3 characters long.');
          } else {
            const todoJSON = serializeTodoData($(e.target));

            API.createTodo(todoJSON).done((newTodoJSON) => {
              const newTodo = TodosManager.create(newTodoJSON);

              UI.addNewTodo(newTodo);
            });
          }
        });
      },

      bindToggleCompleteTodo() {
        UI.$todosList.on('click', 'td.list_item', (e) => {
          const $todo = $(e.currentTarget);
          const $todoCheckboxInput = $todo.find('input[type="checkbox"]');
          const isCompletedTodo = $todoCheckboxInput.prop('checked');
          const todoId = Number($todoCheckboxInput.attr('name').match(/[0-9]+$/)[0]);

          API.updateTodo(todoId, {
            completed: !isCompletedTodo,
          }).done((updatedTodoJSON) => {
            TodosManager.update(updatedTodoJSON);

            UI.updateTodo(updatedTodoJSON.id);
          });
        });
      },

      bindCompleteTodo() {
        UI.$markTodoCompleteButton.on('click', () => {
          const formTodoId = UI.$editTodoForm.attr('data-todo-id');

          if (formTodoId === undefined) {
            alert('Cannot mark as complete as item has not been created yet!');
          } else {
            const todoId = Number(formTodoId);

            if (!TodosManager.getTodoById(todoId).completed) {
              API.updateTodo(todoId, {
                completed: true,
              }).done((updatedTodoJSON) => {
                TodosManager.update(updatedTodoJSON);

                UI.updateTodo(updatedTodoJSON.id);
              });
            } else {
              UI.hideEditTodoModal({ fadeOut: false });
            }
          }
        });
      },

      bindUpdateTodo() {
        UI.$editTodoForm.off('submit').on('submit', (e) => {
          e.preventDefault();

          if (UI.$todoTitleInput.val().length < 3) {
            alert('You must enter a title at least 3 characters long.');
          } else {
            const $editTodoForm = $(e.target);
            const todoJSON = serializeTodoData($editTodoForm);
            const todoId = Number($editTodoForm.attr('data-todo-id'));

            API.updateTodo(todoId, todoJSON).done((updatedTodoJSON) => {
              TodosManager.update(updatedTodoJSON);

              UI.updateTodo(updatedTodoJSON.id);
            });
          }
        });
      },

      bindDeleteTodo() {
        UI.$todosList.on('click', '.delete', (e) => {
          const $todo = $(e.target).closest('tr');
          const todoId = Number($todo.attr('data-id'));

          API.deleteTodo(todoId).done(() => {
            TodosManager.delete(todoId);
            UI.removeTodo($todo);
          });
        });
      },
    };
  })();

  const App = {
    init() {
      API.fetchAllTodos().done((todosJSON) => {
        TodosManager.cache(todosJSON);

        UI.render();

        UIEventListeners.bind();
        AppEventListeners.bind();
      });
    },
  };

  App.init();
});
