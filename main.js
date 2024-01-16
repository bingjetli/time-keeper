'use strict';


let project_container = null;
let timer_list = [];



const createDivider = _ => {
  const divider = document.createElement('div');
  divider.classList.add('divider');
  divider.innerHTML = '&nbsp;';
  return divider;
};


const createTaskControlsContainer = children => {
  const container = document.createElement('div');
  container.classList.add('task-controls-container');
  container.append(children);


  return container;
};



/** STORAGE STRUCTURE
 * 
 * {
 *  project_list: [project-0, project-1, ..., project-n],
 * 
 *  project-0 : {
 *    name : string,
 *    data : [task-0, task-group-0, ..., task-n],
 *  },
 * 
 *  ...,
 * 
 *  task-group-0 : {
 *    name : string,
 *    tasks : [task-1, task-2, ..., task-n],
 *  },
 * 
 *  task-0 : {
 *    name : string,
 *    duration : milliseconds
 *  },
 * 
 *  ...,
 * }
 * 
 */


window.onload = _ => {
  //First, get a pointer to the project container.
  project_container = document.getElementById('project-container');
  if (project_container !== null) {

    //TODO: Use localstorage to check for stored projects. If there are
    //existing projects, draw them in the DOM.


    //After drawing the existing projects, draw the `new_project` button.
    const new_project_button = document.createElement('button');
    new_project_button.innerText = 'new project';
    new_project_button.onclick = _ => createNewProject({
      newProjectButton: new_project_button,
    });
    new_project_button.classList.add('clickable');
    project_container.append(new_project_button);


    //Start the global update timer.
    setInterval(_ => {
      if (timer_list.length > 0) {

        const current_timestamp = Date.now();
        const active_timers = [];

        //If there are timers in the timer_list, we update each one.
        timer_list.forEach(timer => {

          if (timer.isRemovedOnTick === false) {
            timer.element.innerText = toTimeString(current_timestamp - timer.startTime);
            active_timers.push(timer);
          }

        });


        timer_list = active_timers;
      }
    }, 1000);
  }
};


function createNewProject({
  newProjectButton
}) {

  //The `project_id` is a unix timestamp of the current time when the 
  //new project was created. This ensures that the project IDs are 
  //mostly unique.
  const project_id = Date.now();
  const new_project = document.createElement('div');
  new_project.id = 'project-' + project_id + '-container';
  new_project.classList.add('project');


  const new_task_group_button = document.createElement('button');
  new_task_group_button.innerText = 'new task group';
  new_task_group_button.classList.add('clickable');
  new_task_group_button.onclick = _ => createNewTaskGroup({
    projectContainer: new_project,
    newTaskGroupButton: new_task_group_button,
  });


  const new_task_button = document.createElement('button');
  new_task_button.innerText = 'new task';
  new_task_button.classList.add('clickable');
  new_task_button.onclick = _ => createNewTask({
    parentContainer: new_project,
    newTaskButton: new_task_button,
  });


  const new_buttons_container = document.createElement('div');
  new_buttons_container.classList.add('new-buttons-container');
  new_buttons_container.append(new_task_group_button, new_task_button);


  const rename_title_button = document.createElement('button');
  rename_title_button.innerText = 'project-' + project_id;
  rename_title_button.id = 'project-' + project_id + '-title';
  rename_title_button.classList.add('clickable', 'project-title');
  rename_title_button.onclick = _ => renameTitle({
    triggerButton: rename_title_button,
    key: 'project-' + project_id,
  });

  new_project.append(
    rename_title_button,
    createDivider(),
    new_buttons_container,
  );
  newProjectButton.replaceWith(new_project);
  new_project.after(newProjectButton);


  //Update the localstorage.
  let project_list = localStorage.getItem('project-list');
  if (project_list === null) localStorage.setItem(
    'project-list',
    JSON.stringify(['project-' + project_id]),
  );
  else {
    //Parse the `project_list` into it's actual datatype.
    project_list = JSON.parse(project_list);


    //Add the new project_id to the project list.
    // @ts-ignore
    project_list.push('project-' + project_id);


    //Update the localstorage item.
    localStorage.setItem(
      'project-list',
      JSON.stringify(project_list),
    );

  }
  //Create the project item in localstorage.
  localStorage.setItem('project-' + project_id, JSON.stringify({
    name: rename_title_button.innerText,
    data: [],
  }));
}


function createNewTask({
  parentContainer,
  newTaskButton
}) {

  const task_id = Date.now();
  const new_task = document.createElement('div');
  new_task.id = 'task-' + task_id + '-container';
  new_task.classList.add('task');


  const rename_title_button = document.createElement('button');
  rename_title_button.innerText = 'task-' + task_id;
  rename_title_button.id = 'task-' + task_id + '-title';
  rename_title_button.classList.add('clickable', 'task-title');
  rename_title_button.onclick = _ => renameTitle({
    triggerButton: rename_title_button,
    key: 'task-' + task_id,
  });


  const timer = document.createElement('span');
  timer.innerText = toTimeString(0);
  timer.id = 'task-' + task_id + '-timer';
  const timer_object = {
    element: timer,
    startTime: Date.now(),
    isRemovedOnTick: false,
    removeOnTick: function () { this.isRemovedOnTick = true; },
  };
  timer_list.push(timer_object);


  //Saving a task will stop the timer and show the `new task` button
  //again.
  const save_task_button = document.createElement('button');
  save_task_button.id = 'task-' + task_id + '-save-button';
  save_task_button.innerText = 'save task';
  save_task_button.classList.add('clickable');
  save_task_button.onclick = _ => saveTask({
    parentContainer: parentContainer,
    saveTaskButton: save_task_button,
    newTaskButton: newTaskButton,
    taskTimer: timer_object,
    taskTitleElement: rename_title_button,
  });


  const save_button_container = document.createElement('div');
  save_button_container.classList.add('task-controls-container');
  save_button_container.append(save_task_button);


  new_task.append(
    rename_title_button,
    timer,
    save_button_container,
  );
  if (
    newTaskButton.parentNode !== null &&
    newTaskButton.parentNode.classList.contains('new-buttons-container') === true
  ) {
    newTaskButton.parentNode.replaceWith(new_task);
    new_task.after(createDivider());
  }
  else newTaskButton.replaceWith(new_task);


}



function createNewTaskGroup({
  projectContainer,
  newTaskGroupButton,
}) {

  const task_group_id = Date.now();
  const new_task_group = document.createElement('div');
  new_task_group.id = 'task-group-' + task_group_id + '-container';
  new_task_group.classList.add('task-group');


  const title_container = document.createElement('div');
  title_container.classList.add('task-group-title-container');
  const rename_title_button = document.createElement('button');
  rename_title_button.innerText = 'task-group-' + task_group_id;
  rename_title_button.id = 'task-group-' + task_group_id + '-title';
  rename_title_button.classList.add('clickable', 'task-group-title');
  rename_title_button.onclick = _ => renameTitle({
    triggerButton: rename_title_button,
    key: 'task-group-' + task_group_id,
  });
  title_container.append(rename_title_button);


  const task_container = document.createElement('div');
  task_container.id = 'task-group-task-' + task_group_id + '-container';
  task_container.classList.add('task-group-task-container');
  const new_task_button = document.createElement('button');
  new_task_button.innerText = 'new task';
  new_task_button.classList.add('clickable');
  new_task_button.onclick = _ => createNewTask({
    parentContainer: task_container,
    newTaskButton: new_task_button,
  });
  task_container.append(createTaskControlsContainer(new_task_button));


  new_task_group.append(title_container, task_container);
  newTaskGroupButton.parentNode.replaceWith(new_task_group);
  new_task_group.after(createDivider(), newTaskGroupButton.parentNode);


  //Update local storage.
  const project_id = projectContainer.id.split('-')[1];
  let project = localStorage.getItem('project-' + project_id);
  if (project === null) alert('bug detected, trying to create a task group for a project that doesn\'t exist in the localstorage.');
  else {
    //Parse the project into it's actual object.
    project = JSON.parse(project);


    //Update the tasks array for this project.
    //@ts-ignore
    project.data.push('task-group-' + task_group_id);


    //Update the project in localstorage.
    localStorage.setItem(
      'project-' + project_id,
      JSON.stringify(project),
    );

  }

  //Create the `task group` item in localstorage.
  localStorage.setItem(
    'task-group-' + task_group_id,
    JSON.stringify({
      name: rename_title_button.innerText,
      tasks: [],
    }),
  );
}


function saveTask({
  parentContainer,
  saveTaskButton,
  newTaskButton,
  taskTitleElement,
  taskTimer,
}) {

  //Stop the timer and remove it from the list of timers.
  taskTimer.removeOnTick();


  //Remove the save task button.
  saveTaskButton.remove();


  //Add the new task button again after th
  if (
    newTaskButton.parentNode !== null &&
    newTaskButton.parentNode.classList.contains('new-buttons-container') === true
  ) {
    parentContainer.append(newTaskButton.parentNode);
  }
  else {
    parentContainer.append(createTaskControlsContainer(newTaskButton));
  }


  //Update the local storage.
  const task_id = taskTimer.element.id.split('-')[1];
  localStorage.setItem(
    'task-' + task_id,
    JSON.stringify({
      name: taskTitleElement.innerText,
      duration: Date.now() - taskTimer.startTime,
    }),
  );
  if (parentContainer.id.startsWith('task-group-')) {
    const task_group_id = parentContainer.id.split('-')[3];
    let task_group = localStorage.getItem('task-group-' + task_group_id);
    if (task_group === null) alert('bug detected, trying to update a task group that doesn\'t exist in the localstorage.');
    else {

      //Reassign the string received from `.getItem()` with the actual
      //JSON object it represents.
      task_group = JSON.parse(task_group);


      //@ts-ignore
      task_group.tasks.push('task-' + task_id);


      localStorage.setItem(
        'task-group-' + task_group_id,
        JSON.stringify(task_group),
      );
    }
  }
  else {

    //This task is added to the main project object instead of a
    //task group. `parentContainer` references a project.
    const project_id = parentContainer.id.split('-')[1];
    let project = localStorage.getItem('project-' + project_id);
    if (project === null) alert('bug detected, trying to create a task for a project that doesn\'t exist in the localstorage.');
    else {

      //Parse the project into it's actual object.
      project = JSON.parse(project);


      //Update the tasks array for this project.
      //@ts-ignore
      project.data.push('task-' + task_id);


      //Update the project in localstorage.
      localStorage.setItem(
        'project-' + project_id,
        JSON.stringify(project),
      );

    }

  }

}


function renameTitle({
  triggerButton,
  key,
}) {

  function saveTitle() {
    triggerButton.innerText = textfield.value;

    rename_container.replaceWith(triggerButton);


    //Update the localstorage.
    let item = localStorage.getItem(key);
    if (item === null) console.log('bug detected, trying to update ' + key + ' but it doesn\'t exist in the localstorage.');
    else {
      item = JSON.parse(item);


      //@ts-ignore
      item.name = textfield.value.trim();


      localStorage.setItem(
        key,
        JSON.stringify(item),
      );
    }
  }

  const rename_container = document.createElement('span');
  rename_container.classList.add('rename-container');
  const textfield = document.createElement('input');
  const save_button = document.createElement('button');


  textfield.value = triggerButton.innerText;
  if (key.startsWith('project-') === true) textfield.classList.add('project-title');
  if (key.startsWith('task-') === true) textfield.classList.add('task-title');
  if (key.startsWith('task-group') === true) textfield.classList.add('task-group-title');
  textfield.onkeyup = e => {
    if (e.key === 'Enter') saveTitle();
  };

  save_button.innerText = 'save';
  save_button.classList.add('clickable');
  save_button.onclick = _ => saveTitle();


  rename_container.append(textfield);
  rename_container.append(save_button);
  triggerButton.replaceWith(rename_container);
  textfield.setSelectionRange(0, -1);
  textfield.focus();
}




function toTimeString(unix_timestamp) {
  const seconds = Math.trunc(unix_timestamp / 1000);
  const minutes = seconds > 59 ? Math.trunc(seconds / 60) : 0;
  const hours = minutes > 59 ? Math.trunc(minutes / 60) : 0;


  return `${hours.toString().padStart(2, '0')} : ${(minutes % 60).toString().padStart(2, '0')} : ${(seconds % 60).toString().padStart(2, '0')}`;
}