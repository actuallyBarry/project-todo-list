import {format} from "date-fns";
import './style.css';

/* ============================================================================================= */
let pool = JSON.parse(localStorage.getItem('pool')) || [{ title: 'wake up', description: 'at 7 a.m.', duedate: new Date().toISOString().split('T')[0], priority: 'high', category: 'chores', isDone: true }, { title: 'get coffee', description: 'with Sophie', duedate: new Date().toISOString().split('T')[0], priority: 'low', category: 'friends', isDone: false }, { title: 'party', description: 'in the evening at Max\'s, bring wine', duedate: new Date().toISOString().split('T')[0], priority: 'medium', category: 'friends', isDone: false }, { title: 'do the laundry', description: 'check if Bryan got the machine fixed', duedate: '2023-01-29', priority: 'high', category: 'chores', isDone: false }, { title: 'say hi to neighbor', description: 'ap.34c they just moved in yesterday', duedate: '2023-01-30', priority: 'low', category: 'people', isDone: false }, { title: 'do the dishes', description: 'from two days ago', duedate: '2023-01-31', priority: 'low', category: 'chores', isDone: true }, { title: 'call grandma', description: 'it\'s her birthday', duedate: '2023-08-15', priority: 'medium', category: 'family', isDone: false }, { title: 'help Sam', description: 'we have to color the walls in his room', duedate: '2023-08-24', priority: 'none', category: 'family', isDone: false }, { title: 'interview', description: 'at 4 p.m.', duedate: '2023-08-20', priority: 'none', category: 'work', isDone: false }]
let today = []
let week = []
let categories = JSON.parse(localStorage.getItem('categories')) || {};

/* ===================================     LOCAL STORAGE     =================================== */
function populateStorage() {
    let storageCategories = {}
    Object.keys(categories).forEach(k => storageCategories[k] = [])
    localStorage.setItem('pool', JSON.stringify(pool));
    localStorage.setItem('categories', JSON.stringify(storageCategories));
}

/* ============================     C O R E   F U N C T I O N S     ============================ */
// access currently displaying list
let currentLsTtl = 'pool';
function currentList(ttl) {                                          //! currentLsTtl + categories
    if (ttl) { currentLsTtl = ttl }
    if (!ttl) {
        return (currentLsTtl in categories) ? categories[currentLsTtl] : eval(currentLsTtl);
    }
}

// sort tasks by duedate & priority                                  //! pool
function sortTasks() {
    pool.sort((a, b) => {
        if(a.duedate != b.duedate) {return a.duedate.split('-').join('') - b.duedate.split('-').join('')};
        if(a.duedate == b.duedate) {
            if(a.priority != b.priority) {
                if(a.priority == 'high' || b.priority == 'none' || (a.priority == 'medium' && b.priority == 'low')) { return -1 };
                if(a.priority == 'none' || b.priority == 'high' || (a.priority == 'low' && b.priority == 'medium')) { return 1 };
            } else if (a.priority == b.priority) { return 0 }
        }
    })
}

function distributeTasks() {                                         //! pool + categories + today + week
    // reset sublists
    today = []
    week = []
    for(let list in categories) { categories[list] = [] }
    sortTasks();

    // current day
    let currentDate = new Date();
    const offset = currentDate.getTimezoneOffset();
    currentDate = new Date(currentDate.getTime() - (offset*60*1000));

    for (const task of pool) {
        // today
        if (currentDate.toISOString().split('T')[0] === task.duedate) today.push(task);
        // week
        if ((new Date(task.duedate) - currentDate)/1000/60/60/24 > 0 && (new Date(task.duedate) - currentDate)/1000/60/60/24 < 7) week.push(task);
        // category
        if (task.category) {
            createCategory(task.category);
            if (categories[task.category]) categories[task.category].push(task);
        }
    } 
}
distributeTasks();

// task-related fns
function addNewTask() {                                              //! pool
    pool.push(newTaskObj());
    distributeTasks();
}

function removeTask(taskIndex) {                                     //! pool
    pool.splice(taskIndex, 1);
    distributeTasks();
}

function toggleTaskStatus(taskIndex) {                               //! pool
    pool[taskIndex].isDone = pool[taskIndex].isDone ? false : true;
}

// category-related fns
function categoryInpIsValid(name) {
    let noInvalidChar = name.trim().split('').every(ch => ch.match(/[A-Z_-\d]/gi));
    let firstCharNotDigit = name.trim().charAt(0).match(/\d/gi) == null;
    let lengthIsValid = name.trim().length <= 16;
    return (noInvalidChar && firstCharNotDigit && lengthIsValid)
}

function createCategory(name) {                                      //! categories
    if (name.trim() && !categories[name.trim()] && categoryInpIsValid(name)) {
        categories[name.trim()] = []
    }
}

function deleteCategory(name) {                                      //! pool + categories
    for (let i=0; i < pool.length; ) {
        if (pool[i].category == name) {
            removeTask(i);
        } else { i++ }
    }
    delete categories[name];
}

function renameCategory(newName) {                                   //! pool + categories + currentLsTtl
    pool.forEach(tsk => { if(tsk.category == currentLsTtl) {tsk.category = newName.trim()} });
    delete categories[currentLsTtl];
}


/* ==============================     U I   F U N C T I O N S     ============================== */
// change category's bgc when active                                 //! currentLsTtl
function styleCurrentList() {
    const sbElements = document.querySelectorAll('#sidebar *');
    sbElements.forEach(el => el.removeAttribute('data-current-list'));
    sbElements.forEach(el => { if(el.dataset.title==currentLsTtl) el.dataset.currentList = true });
}

// display list's header                                             //! categories + currentLsTtl
function renderListHeader() {
    const headrTtl = document.querySelector('#header h2');
    const headerBtns = document.querySelector('#header-btns');
    headerBtns.style.setProperty('visibility', 'hidden');
    if (currentLsTtl == 'pool') { headrTtl.textContent = 'All' };
    if (currentLsTtl == 'today') { headrTtl.textContent = 'Today' };
    if (currentLsTtl == 'week') { headrTtl.textContent = 'Next 7 days' };
    if (currentLsTtl in categories) {
        headrTtl.textContent = currentLsTtl;
        headerBtns.style.setProperty('visibility', 'visible');
    }
}

// display tasks on list in DOM
function displayTasksInList() {
    const listDOM = document.getElementById('list');
    listDOM.innerHTML = '';
    renderListHeader();
    currentList().forEach((task) => {
        let ddNewFormat = (task.duedate)?format(new Date(task.duedate), 'MMM do'):'';
        var htmlTask = `<div class="task" data-title="${task.title}" data-priority="${task.priority}"><input type="checkbox" ${task.isDone?'checked':''}><p>${task.title}</p><button class="task-details">Details</button><p>${ddNewFormat}</p><svg viewBox="0 0 24 24" class="task-edit"><path></svg><svg viewBox="0 0 24 24" class="task-delete"><path></svg></div>`;
        listDOM.insertAdjacentHTML('beforeend', htmlTask);
    })
    styleCurrentList();
}
displayTasksInList();

// add categories to DOM sidebar                                     //! categories + currentLsTtl
function displaySbCategories() {
    const sbCategoriesDOM = document.getElementById('sidebar-categories');
    sbCategoriesDOM.innerHTML = '';
    const catgoryInpOptions = document.getElementById('category-input-options');
    catgoryInpOptions.innerHTML = '';
    for (let key in categories) {
        var htmlCategory = `<div class="sidebar-category" data-title="${key}" data-current-list=${(key==currentLsTtl)?true:false}><span>${key}</span><span class="count"></span></div>`;
        sbCategoriesDOM.insertAdjacentHTML('beforeend', htmlCategory);
        catgoryInpOptions.insertAdjacentHTML('beforeend', `<option>${key}</option>`);
    }
    styleCurrentList();
}
displaySbCategories();

// set count for lists in sidebar                                    //! pool + categories + today + week
function setCount() {
    let poolCount = 0;
    pool.forEach(tsk => {if(!tsk.isDone) ++poolCount});
    document.querySelector('[data-title=pool] .count').textContent = poolCount?poolCount:'';
    let todayCount = 0;
    today.forEach(tsk => {if(!tsk.isDone) ++todayCount});
    document.querySelector('[data-title=today] .count').textContent = todayCount?todayCount:'';
    let weekCount = 0;
    week.forEach(tsk => {if(!tsk.isDone) ++weekCount});
    document.querySelector('[data-title=week] .count').textContent = weekCount?weekCount:'';
    for(let list in categories) {
        let count = 0;
        categories[list].forEach(tsk => {if(!tsk.isDone) ++count});
        document.querySelector(`[data-title=${list}] .count`).textContent = count?count:'';
    }
}
setCount();

// toggle modals
function toggleModal(nameStr) {
    const addModal = document.querySelector('.add-modal');
    const editModal = document.querySelector('.edit-modal');
    const detailModal = document.querySelector('.detail-modal');
    if (nameStr == 'add') { addModal.classList.toggle('show-modal') };
    if (nameStr == 'edit') { editModal.classList.toggle('show-modal') };
    if (nameStr == 'details') { detailModal.classList.toggle('show-modal') };
}

// create new task object
function newTaskObj() {
    let categoryTtl = document.querySelector('#add-form-category').value.trim();
    return { 
    title: document.querySelector('#add-form-title').value.trim(),
    description: document.querySelector('#add-form-description').value,
    duedate: document.querySelector('#add-form-duedate').value,
    priority: document.querySelector('#add-form-priority').value,
    category: categoryInpIsValid(categoryTtl)?categoryTtl:'',
    created: new Date().toISOString().split('T')[0],
    isDone: false }
}

// reset add-task inputs
function resetAddInputs() {
    document.querySelector('#add-form-title').value = '';
    document.querySelector('#add-form-description').value = '';
    document.querySelector('#add-form-duedate').value = new Date().toISOString().split('T')[0];
    document.querySelector('#add-form-priority').value = 'low';
    document.querySelector('#add-form-category').value = '';
}

// check add-form title input validity                               //! pool
function addTskInpIsValid() {
    let inpVal = document.querySelector('#add-form-title').value.trim();
    return (inpVal && !pool.some(tsk => tsk.title == inpVal)) ? true : false;
}

// check edit-form title input validity                              //! pool + taskOnModal
function editTskInpIsValid() {
    let inpVal = document.querySelector('#edit-form-title').value.trim();
    let titleExists = false;
    for (let i=0; i<pool.length; i++) {
        if (i == taskOnModal) continue;
        if (pool[i].title == inpVal) titleExists = true;
    }
    return (inpVal && !titleExists) ? true : false;
}

// show task properties on edit modal                                //! pool + taskOnModal
let taskOnModal;
function putPropsOnEditModal() {
    document.querySelector('#edit-form-title').value = pool[taskOnModal].title;
    document.querySelector('#edit-form-description').value = pool[taskOnModal].description;
    document.querySelector('#edit-form-duedate').value = pool[taskOnModal].duedate;
    document.querySelector('#edit-form-priority').value = pool[taskOnModal].priority;
    document.querySelector('#edit-form-category').value = pool[taskOnModal].category;
}

// update task properties after edit                                 //! pool + taskOnModal
function updateTasksProps() {
    let categoryTtl = document.querySelector('#edit-form-category').value.trim();
    pool[taskOnModal].title = document.querySelector('#edit-form-title').value.trim();
    pool[taskOnModal].description = document.querySelector('#edit-form-description').value;
    pool[taskOnModal].duedate = document.querySelector('#edit-form-duedate').value;
    pool[taskOnModal].priority = document.querySelector('#edit-form-priority').value;
    pool[taskOnModal].category = categoryInpIsValid(categoryTtl)?categoryTtl:pool[taskOnModal].category;
}

// show task properties on detail modal
function putPropsOnDetailModal(task) {
    document.querySelector('#details-title').textContent = task.title;
    document.querySelector('#details-description').textContent = task.description?task.description:'-';
    document.querySelector('#details-duedate').textContent = task.duedate?format(new Date(task.duedate), 'ccc, MMM do, yyyy'):'-';
    document.querySelector('#details-priority').textContent = task.priority;
    document.querySelector('#details-category').textContent = task.category?task.category:'-';
    document.querySelector('#details-created').textContent = task.created?format(new Date(task.created), 'ccc, MMM do, yyyy'):'-';
}

// toggle sidebar category-input visibility
const addCatgInit = document.querySelector('#sidebar #screen');
const sidebarInput = document.getElementById('sidebar-add-category');
const sbAddCategoryBtn = document.querySelector('#sidebar button');
function showSbInput() {
    addCatgInit.classList.add('hide-input');
    sidebarInput.classList.remove('hide-input');
    sbAddCategoryBtn.classList.remove('hide-input');
}
function hideSbInput() {
    addCatgInit.classList.remove('hide-input');
    sidebarInput.classList.add('hide-input');
    sbAddCategoryBtn.classList.add('hide-input');
}

// find task's index in pool
function tskIndexInPool(clickedEl) {                                 //! pool
    return pool.findIndex(tsk => tsk.title == clickedEl.parentElement.dataset.title);
}


/* ===============================     U I   H A N D L E R S     =============================== */
// set current list and update list on click
window.addEventListener('click', (e) => {
    let tTtl = e.target.dataset.title;
    if(tTtl=='pool' || tTtl=='today' || tTtl=='week' || e.target.className=='sidebar-category') {
        currentList(tTtl);
        displayTasksInList();
        document.getElementById('navigator').focus()
    }
})

// handle adding category
window.addEventListener('click', (e) => {
    if (e.target.id == 'lower-sb' || e.target == addCatgInit || e.target.className.baseVal == 'plus-icon' || e.target == sidebarInput) { showSbInput(); sidebarInput.focus() }
    else { hideSbInput(); sidebarInput.value = '' }
})
sbAddCategoryBtn.addEventListener('click', () => {
    createCategory(sidebarInput.value);
    displaySbCategories();
    setCount();
    populateStorage()
})

// remove category and its tasks
const categoryDelBtn = document.querySelector('.category-delete');
categoryDelBtn.addEventListener('click', () => {
    if (!confirm("This list and all its tasks will be deleted!")) {return}
    deleteCategory(currentLsTtl);
    displaySbCategories();
    currentList('pool');
    displayTasksInList();
    setCount();
    populateStorage();
})

// handle category rename
const headerTitl = document.querySelector('#header h2');
const catgRenameInitBtn = document.querySelector('.category-edit');
const catgRenameConfirmBtn = document.querySelector('#header button');
catgRenameInitBtn.addEventListener('click', () => {
    headerTitl.setAttribute('contenteditable', true);
    headerTitl.focus();
    catgRenameConfirmBtn.style.setProperty('visibility', 'visible');
})
window.addEventListener('click', (e) => {
    if (!e.target.getAttribute('contenteditable') && e.target != catgRenameInitBtn) {
        headerTitl.setAttribute('contenteditable', false);
        catgRenameConfirmBtn.style.setProperty('visibility', 'hidden');
    }
})
catgRenameConfirmBtn.addEventListener('click', () => {
    let httc = headerTitl.textContent;
    if (categoryInpIsValid(httc) && httc.trim() != '') {
        renameCategory(httc);
        currentList(httc.trim());
        distributeTasks();
        displayTasksInList();
        displaySbCategories();
        setCount();
        populateStorage()
    } else { headerTitl.textContent = currentLsTtl }
})

// toggle task status
window.addEventListener('click', (e) => {
    if (e.target.type == 'checkbox') {
        let tskInd = tskIndexInPool(e.target);
        toggleTaskStatus(tskInd);
        setCount();
        populateStorage()
    }
})

// remove task from list
window.addEventListener('click', (e) => {
    if (e.target.className.baseVal == 'task-delete') {
        let tskInd = tskIndexInPool(e.target);
        removeTask(tskInd);
        displayTasksInList();
        setCount();
        populateStorage()
    }
})

// handle add modal
const addInitBtn = document.querySelector('#main #footer-btn');
addInitBtn.addEventListener('click', () => {
    toggleModal('add');
    resetAddInputs();
    document.querySelector('#add-form-title').focus()
})
const addBtn = document.querySelector('#add-form button');
addBtn.addEventListener('click', () => {
    if(!addTskInpIsValid()) { return }
    addNewTask();
    displayTasksInList();
    displaySbCategories();
    setCount();
    toggleModal('add');
    populateStorage();
});
const addCloseBtn = document.querySelector('.add-close-button');
addCloseBtn.addEventListener('click', () => toggleModal('add'));

// handle edit modal
window.addEventListener('click', (e) => {
    if (e.target.className.baseVal == 'task-edit') {
        toggleModal('edit');
        taskOnModal = tskIndexInPool(e.target);
        putPropsOnEditModal();
    }
})
const editConfirmBtn = document.querySelector('#edit-form button');
editConfirmBtn.addEventListener('click', () => {
    if (!editTskInpIsValid()) {return}
    updateTasksProps();
    distributeTasks();
    displayTasksInList();
    displaySbCategories();
    setCount();
    toggleModal('edit');
    populateStorage();
})
const editCloseBtn = document.querySelector('.edit-close-button');
editCloseBtn.addEventListener('click', () => toggleModal('edit'));

// handle detail modal
window.addEventListener('click', (e) => {
    if (e.target.className == 'task-details') {
        toggleModal('details');
        let task = pool[tskIndexInPool(e.target)];
        putPropsOnDetailModal(task)
    }
})
const detailsCloseBtn = document.querySelector('.details-close-button');
detailsCloseBtn.addEventListener('click', () => toggleModal('details'));
