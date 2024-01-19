'use strict';


let project_container = null;
let timer_list = [];



const DividerComponent = _ => {
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


const TaskComponent = (
  task_key,
  parent_container,
  new_task_button,
) => {

  //Create a reference to the `task id`, if a `task_key` was given,
  //extract it from the `task_key` otherwise generate a new id using
  //the current unix timestamp.
  const task_id = task_key === null ?
    Date.now() :
    task_key.split('-')[1];

  //Create the task container HTML element. And set the element id to
  //the task key that will be used to reference the local storage. If
  //a `task_key` was provided, use that instead. Otherwise, generate 
  //a new one.
  const task_div = document.createElement('div');
  task_div.id = 'task-' + task_id;
  task_div.classList.add('task');


  //Now try to load the task data from the local storage if a `task_key`
  //was provided.
  let stored_task = null;
  if (task_key !== null) {
    const value_string = localStorage.getItem(task_key);
    if (value_string === null) alert('Bug detected, failed to load ' + task_key + ' from the local storage.');
    else {
      stored_task = JSON.parse(value_string);
    }
  }


  //Now, create the title element. And append it to the task container.
  const task_title_button = document.createElement('button');
  task_title_button.innerText = stored_task !== null ?
    stored_task.name :
    'task-' + task_id;
  task_title_button.id = 'task-' + task_id + '-title';
  task_title_button.classList.add('clickable', 'task-title');
  task_title_button.onclick = _ => renameTitle({
    triggerButton: task_title_button,
    key: 'task-' + task_id,
  });
  task_div.append(task_title_button);


  //Now create the task timer display element.
  const task_duration_span = document.createElement('span');
  task_duration_span.innerText = stored_task === null ?
    toTimeString(0) :
    toTimeString(stored_task.duration);
  task_duration_span.id = 'task-' + task_id + '-timer';
  task_div.append(task_duration_span);


  if (stored_task === null) {

    //Create an object to store timer details. And add this object on
    //to the list of active timers. This also starts the timer countdown.
    const timer_object = {
      element: task_duration_span,
      startTime: Date.now(),
      isRemovedOnTick: false,
      removeOnTick: function () { this.isRemovedOnTick = true; },
    };
    timer_list.push(timer_object);


    //Now create the button to stop the timer.
    //Saving a task will stop the timer and show the `new task` button
    //again.
    if (project_container === null || new_task_button === null) {
      alert('bug detected, trying to create a new task component but the parameters `project_container` or `new_task_button` are null.');
    }
    const save_task_button = document.createElement('button');
    save_task_button.id = 'task-' + task_id + '-save-button';
    save_task_button.innerText = 'save task';
    save_task_button.classList.add('clickable');
    save_task_button.onclick = _ => saveTask({
      parentContainer: parent_container,
      saveTaskButton: save_task_button,
      newTaskButton: new_task_button,
      taskTimer: timer_object,
      taskTitleElement: task_title_button,
    });


    const save_button_container = document.createElement('div');
    save_button_container.classList.add('task-controls-container');
    save_button_container.append(save_task_button);
    task_div.append(save_button_container);
  }


  return task_div;
};


const TaskGroupComponent = task_group_key => {

  const task_group_id = task_group_key === null ?
    Date.now() :
    task_group_key.split('-')[2];
  const task_group_div = document.createElement('div');
  task_group_div.id = 'task-group-' + task_group_id;
  task_group_div.classList.add('task-group');


  //Try to load the task group data from local storage.
  let stored_task_group = null;
  if (task_group_key !== null) {
    const value_string = localStorage.getItem(task_group_key);
    if (value_string === null) alert('bug detected, failed to load ' + task_group_key + ' from the localstorage.');
    else {
      stored_task_group = JSON.parse(value_string);
    }
  }


  const title_section = document.createElement('div');
  title_section.classList.add('task-group-title-container');

  const task_group_title_button = document.createElement('button');
  task_group_title_button.innerText = stored_task_group === null ?
    'task-group-' + task_group_id :
    stored_task_group.name;
  task_group_title_button.id = 'task-group-' + task_group_id + '-title';
  task_group_title_button.classList.add('clickable', 'task-group-title');
  task_group_title_button.onclick = _ => renameTitle({
    triggerButton: task_group_title_button,
    key: 'task-group-' + task_group_id,
  });
  title_section.append(task_group_title_button);
  task_group_div.append(title_section);


  const tasks_section = document.createElement('div');
  tasks_section.id = 'task-group-task-' + task_group_id + '-container';
  tasks_section.classList.add('task-group-task-container');

  //Draw existing tasks inside the tasks section if they exist.
  if (stored_task_group !== null) {
    stored_task_group.tasks.forEach(task_key => {
      tasks_section.append(TaskComponent(task_key, null, null));
    });
  }

  const new_task_button = document.createElement('button');
  new_task_button.innerText = 'new task';
  new_task_button.classList.add('clickable');
  new_task_button.onclick = _ => createNewTask({
    parentContainer: tasks_section,
    newTaskButton: new_task_button,
  });
  tasks_section.append(createTaskControlsContainer(new_task_button));
  task_group_div.append(tasks_section);


  return task_group_div;
};




const ProjectComponent = project_key => {

  //The `project_id` is a unix timestamp of the current time when the 
  //new project was created. This ensures that the project IDs are 
  //mostly unique.
  const project_id = project_key === null ?
    Date.now() :
    project_key.split('-')[1];
  const project_div = document.createElement('div');
  project_div.id = project_key === null ?
    'project-' + project_id :
    project_key;
  project_div.classList.add('project');


  //Try to retreive the project from localstorage if a project key was
  //provided.
  let stored_project = null;
  if (project_key !== null) {

    //The user provided a project key to an existing project, so we'll
    //try to load it from localstorage.
    const value_string = localStorage.getItem(project_key);

    if (value_string !== null) {

      //If the project was successfully loaded from the localStorage,
      //we convert it to JSON and save it into `stored_project`;
      stored_project = JSON.parse(value_string);
    }
    else alert('Bug detected, tried to load "' + project_key + '" but it doesn\'t exist in the localstorage.');
  }


  //Draw the project title.
  const project_title_button = document.createElement('button');
  project_title_button.innerText = stored_project === null ?
    'project-' + project_id :
    stored_project.name;
  project_title_button.id = 'project-' + project_id + '-title';
  project_title_button.classList.add('clickable', 'project-title');
  project_title_button.onclick = _ => renameTitle({
    triggerButton: project_title_button,
    key: 'project-' + project_id,
  });
  project_div.append(project_title_button);


  if (stored_project !== null) {
    if (
      stored_project.data !== null &&
      stored_project.data !== undefined
    ) {

      //Draw the tasks or task groups associated with this project.
      stored_project.data.forEach(key => {
        if (key.startsWith('task-group-')) project_div.append(
          DividerComponent(),
          TaskGroupComponent(key)
        );
        else if (key.startsWith('task-')) project_div.append(
          DividerComponent(),
          TaskComponent(key, null, null)
        );
      });
    }
    else alert('Bug detected, the project loaded from localstorage might be corrupted.');
  }


  //Create the task group creation button.
  const new_task_group_button = document.createElement('button');
  new_task_group_button.innerText = 'new task group';
  new_task_group_button.classList.add('clickable');
  new_task_group_button.onclick = _ => createNewTaskGroup({
    projectKey: project_div.id,
    newTaskGroupButton: new_task_group_button,
  });


  //Create the task creation button.
  const new_task_button = document.createElement('button');
  new_task_button.innerText = 'new task';
  new_task_button.classList.add('clickable');
  new_task_button.onclick = _ => createNewTask({
    parentContainer: project_div,
    newTaskButton: new_task_button,
  });


  //Draw the project controls.
  const controls_div = document.createElement('div');
  controls_div.classList.add('new-buttons-container');
  controls_div.append(new_task_group_button, new_task_button);
  project_div.append(
    DividerComponent(),
    controls_div,
  );


  return project_div;
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

    //If there are existing projects, draw them in the DOM.
    let project_list = [];
    const value_string = localStorage.getItem('project-list');
    if (value_string !== null) {

      //This means there might be existing projects in the localstorage.
      project_list = JSON.parse(value_string);
    }
    project_list.forEach(project_key => {
      project_container.append(ProjectComponent(project_key));
    });


    //After drawing the existing projects, draw the `new_project` button.
    const new_project_button = document.createElement('button');
    new_project_button.innerText = 'new project';
    new_project_button.onclick = _ => createNewProject({
      newProjectButton: new_project_button,
      projectList: project_list,
    });
    new_project_button.classList.add('clickable');
    project_container.append(new_project_button);


    //After drawing the existing projects, draw the `new_project` button.
    const export_button = document.createElement('button');
    export_button.innerText = 'export to excel';
    export_button.classList.add('clickable');
    export_button.onclick = _ => exportToExcel(project_list);
    project_container.append(export_button);


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




function exportToExcel(project_list) {


  if (project_list.length < 1) alert('There is nothing to export!');
  else {

    //Create the excel file.
    const excel_file = XLSX.utils.book_new();


    project_list.forEach(project_key => {

      //Create a new worksheet for each project.
      const worksheet_data = [];


      /** WORKSHEET SCHEMA
       * 
       * [
       *  [project_title],
       *  ['generated-using...'],
       *  ,
       *  [task-group-date, task-group-title,           , total_duration],
       *  [task_date      ,                 , task_title, task_duration],
       *  ,
       *  [task_date      , task_title      ,           , task_duration],
       *  ...
       * ]
       * 
       */


      const project_data_string = localStorage.getItem(project_key);
      if (project_data_string !== null) {

        const project_data = JSON.parse(project_data_string);

        worksheet_data.push(
          [project_data.name],
          ['Generated using Time Keeper @ ' + window.location],
          undefined
        );


        worksheet_data.push(['Date', 'Duration', 'Description'], undefined);
        project_data.data.forEach(key => {

          if (key.startsWith('task-group-')) {

            const data_array = [];

            const timestamp = key.split('-')[2];
            const task_group_data_string = localStorage.getItem(key);


            if (task_group_data_string !== null) {

              const task_group_data = JSON.parse(task_group_data_string);


              let duration_total = 0;
              //Now try to fetch the task group data.
              task_group_data.tasks.forEach(task_key => {

                const timestamp = task_key.split('-')[1];
                const task_data_string = localStorage.getItem(task_key);


                if (task_data_string !== null) {

                  const task_data = JSON.parse(task_data_string);
                  if (task_data !== null) {

                    duration_total += task_data.duration;


                    data_array.push([
                      new Date(Number(timestamp)),
                      formatDuration(task_data.duration),
                      '    ' + task_data.name
                    ]);
                  }
                }
              });


              //Now add the task group entry back to the beginning of 
              //the data array. And concatenate the data array to the
              //worksheet_data array.
              data_array.unshift([
                new Date(Number(timestamp)),
                formatDuration(duration_total),
                task_group_data.name
              ]);

              worksheet_data.push(...data_array);
            }
            //---
          }
          else if (key.startsWith('task-')) {
            const timestamp = key.split('-')[1];
            const date = new Date(Number(timestamp));
            const task_data_string = localStorage.getItem(key);
            if (task_data_string !== null) {
              const task_data = JSON.parse(task_data_string);
              if (task_data !== null) {
                worksheet_data.push([
                  date,
                  formatDuration(task_data.duration),
                  task_data.name
                ]);
              }
            }
          }


          //Add an empty space in the worksheet after each project task/task group.
          worksheet_data.push(undefined);
        });


        const project_sheet = XLSX.utils.aoa_to_sheet(worksheet_data);
        XLSX.utils.book_append_sheet(excel_file, project_sheet, project_data.name);

      }

    });


    //Export the excel file.
    XLSX.writeFile(excel_file, 'timesheet.xlsx', { compression: false });
  }
}




function createNewProject({
  newProjectButton,
  projectList,
}) {

  const new_project = ProjectComponent(null);
  newProjectButton.replaceWith(new_project);
  new_project.after(newProjectButton);


  //Push the project.id which contains the project key onto the list
  //of projects.
  projectList.push(new_project.id);


  //Then update the value in the localstorage.
  localStorage.setItem(
    'project-list',
    JSON.stringify(projectList),
  );


  //Create the project item in localstorage.
  localStorage.setItem(new_project.id, JSON.stringify({
    name: new_project.id,
    data: [],
  }));
}




function createNewTask({
  parentContainer,
  newTaskButton
}) {

  const new_task = TaskComponent(null, parentContainer, newTaskButton);
  if (
    newTaskButton.parentNode !== null &&
    newTaskButton.parentNode.classList.contains('new-buttons-container') === true
  ) {
    newTaskButton.parentNode.replaceWith(new_task);
    new_task.after(DividerComponent());
  }
  else newTaskButton.replaceWith(new_task);
}




function createNewTaskGroup({
  projectKey,
  newTaskGroupButton,
}) {

  //new_task_group.append(title_container, task_container);
  const new_task_group = TaskGroupComponent(null);
  newTaskGroupButton.parentNode.replaceWith(new_task_group);
  new_task_group.after(DividerComponent(), newTaskGroupButton.parentNode);


  //Update the project data field in the local storage.
  const value_string = localStorage.getItem(projectKey);
  if (value_string === null) alert('bug detected, trying to create a task group for a project that does\'t exist in the local storage.');
  else {

    const stored_project = JSON.parse(value_string);
    stored_project.data.push(new_task_group.id);
    localStorage.setItem(
      projectKey,
      JSON.stringify(stored_project),
    );
  }

  //Create the `task group` item in localstorage.
  localStorage.setItem(
    new_task_group.id,
    JSON.stringify({
      name: new_task_group.id,
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
  textfield.classList.add('textfield');
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



function formatDuration(duration_ms) {
  if (duration_ms < 1000) {
    return duration_ms + ' ms';
  }
  else if (duration_ms < (60 * 1000)) {
    return Math.round(duration_ms / 1000) + ' s';
  }
  else if (duration_ms < (60 * 60 * 1000)) {
    return Math.round(duration_ms / (60 * 1000)) + ' m';
  }
  else if (duration_ms < (24 * 60 * 60 * 1000)) {
    return Math.round(duration_ms / (60 * 60 * 1000)) + ' h';
  }
  else {
    return Math.round(duration_ms / (24 * 60 * 60 * 1000)) + ' d';
  }
}